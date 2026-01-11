<?php
/**
 * Class Gutenberg_REST_Attachments_Controller.
 *
 * @package MediaExperiments
 */

/**
 * Class Gutenberg_REST_Attachments_Controller.
 */
class Gutenberg_REST_Attachments_Controller extends WP_REST_Attachments_Controller {
	/**
	 * Registers the routes for attachments.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes(): void {
		parent::register_routes();

		$valid_image_sizes = array_keys( wp_get_registered_image_subsizes() );

		// Special case to set 'original_image' in attachment metadata.
		$valid_image_sizes[] = 'original';
		// Used for PDF thumbnails.
		$valid_image_sizes[] = 'full';

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/sideload',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'sideload_item' ),
					'permission_callback' => array( $this, 'sideload_item_permissions_check' ),
					'args'                => array(
						'id'               => array(
							'description' => __( 'Unique identifier for the attachment.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'image_size'       => array(
							'description' => __( 'Image size.', 'gutenberg' ),
							'type'        => 'string',
							'enum'        => $valid_image_sizes,
							'required'    => true,
						),
						'convert_format'   => array(
							'type'        => 'boolean',
							'default'     => true,
							'description' => __( 'Whether to convert image formats.', 'gutenberg' ),
						),
						'expected_width'   => array(
							'description' => __( 'Expected width of the uploaded image in pixels.', 'gutenberg' ),
							'type'        => 'integer',
							'minimum'     => 1,
						),
						'expected_height'  => array(
							'description' => __( 'Expected height of the uploaded image in pixels.', 'gutenberg' ),
							'type'        => 'integer',
							'minimum'     => 1,
						),
						'validate_dimensions' => array(
							'description' => __( 'Whether to validate that uploaded dimensions match expected dimensions.', 'gutenberg' ),
							'type'        => 'boolean',
							'default'     => false,
						),
					),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves an array of endpoint arguments from the item schema for the controller.
	 *
	 * @param string $method Optional. HTTP method of the request. The arguments for `CREATABLE` requests are
	 *                       checked for required values and may fall-back to a given default, this is not done
	 *                       on `EDITABLE` requests. Default WP_REST_Server::CREATABLE.
	 * @return array Endpoint arguments.
	 */
	public function get_endpoint_args_for_item_schema( $method = WP_REST_Server::CREATABLE ) {
		$args = rest_get_endpoint_args_for_schema( $this->get_item_schema(), $method );

		if ( WP_REST_Server::CREATABLE === $method ) {
			$args['generate_sub_sizes'] = array(
				'type'        => 'boolean',
				'default'     => true,
				'description' => __( 'Whether to generate image sub sizes.', 'gutenberg' ),
			);
			$args['convert_format']     = array(
				'type'        => 'boolean',
				'default'     => true,
				'description' => __( 'Whether to convert image formats.', 'gutenberg' ),
			);
		}

		return $args;
	}

	/**
	 * Prepares a single attachment output for response.
	 *
	 * Ensures 'missing_image_sizes' is set for PDFs and not just images.
	 *
	 * @param WP_Post         $item    Attachment object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ): WP_REST_Response {
		$response = parent::prepare_item_for_response( $item, $request );

		$data = $response->get_data();

		// Handle missing image sizes for PDFs.

		$fields = $this->get_fields_for_response( $request );

		if (
			rest_is_field_included( 'missing_image_sizes', $fields ) &&
			empty( $data['missing_image_sizes'] )
		) {
			$mime_type = get_post_mime_type( $item );

			if ( 'application/pdf' === $mime_type ) {
				$metadata = wp_get_attachment_metadata( $item->ID, true );

				if ( ! is_array( $metadata ) ) {
					$metadata = array();
				}

				$metadata['sizes'] = $metadata['sizes'] ?? array();

				$fallback_sizes = array(
					'thumbnail',
					'medium',
					'large',
				);

				// The filter might have been added by ::create_item().
				remove_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );

				/** This filter is documented in wp-admin/includes/image.php */
				$fallback_sizes = apply_filters( 'fallback_intermediate_image_sizes', $fallback_sizes, $metadata ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

				$registered_sizes = wp_get_registered_image_subsizes();
				$merged_sizes     = array_keys( array_intersect_key( $registered_sizes, array_flip( $fallback_sizes ) ) );

				$missing_image_sizes         = array_diff( $merged_sizes, array_keys( $metadata['sizes'] ) );
				$data['missing_image_sizes'] = $missing_image_sizes;
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$links = $response->get_links();

		$response = rest_ensure_response( $data );

		foreach ( $links as $rel => $rel_links ) {
			foreach ( $rel_links as $link ) {
				$response->add_link( $rel, $link['href'], $link['attributes'] );
			}
		}

		return $response;
	}

	/**
	 * Creates a single attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( ! $request['generate_sub_sizes'] ) {
			add_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
			add_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );

		}

		if ( ! $request['convert_format'] ) {
			add_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		}

		$response = parent::create_item( $request );

		remove_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
		remove_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );

		return $response;
	}


	/**
	 * Checks if a given request has access to sideload a file.
	 *
	 * Sideloading a file for an existing attachment
	 * requires both update and create permissions.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function sideload_item_permissions_check( $request ) {
		$post = $this->get_post( $request['id'] );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		// Check if user can edit the attachment.
		$edit_check = $this->edit_media_item_permissions_check( $request );

		if ( is_wp_error( $edit_check ) ) {
			return $edit_check;
		}

		// Additional check: user must have upload_files capability.
		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error(
				'rest_cannot_sideload',
				__( 'Sorry, you are not allowed to upload files.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Validates that uploaded image dimensions match expected dimensions.
	 *
	 * @param int      $actual_width    Actual width of the uploaded image.
	 * @param int      $actual_height   Actual height of the uploaded image.
	 * @param int|null $expected_width  Expected width, or null to skip validation.
	 * @param int|null $expected_height Expected height, or null to skip validation.
	 * @return true|WP_Error True if dimensions are valid, WP_Error otherwise.
	 */
	private function validate_image_dimensions( $actual_width, $actual_height, $expected_width, $expected_height ) {
		if ( null !== $expected_width && $actual_width !== $expected_width ) {
			return new WP_Error(
				'rest_invalid_image_dimensions',
				sprintf(
					/* translators: 1: Expected width, 2: Actual width. */
					__( 'Image width does not match expected dimensions. Expected %1$d pixels, got %2$d pixels.', 'gutenberg' ),
					$expected_width,
					$actual_width
				),
				array( 'status' => 400 )
			);
		}

		if ( null !== $expected_height && $actual_height !== $expected_height ) {
			return new WP_Error(
				'rest_invalid_image_dimensions',
				sprintf(
					/* translators: 1: Expected height, 2: Actual height. */
					__( 'Image height does not match expected dimensions. Expected %1$d pixels, got %2$d pixels.', 'gutenberg' ),
					$expected_height,
					$actual_height
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Validates uploaded size dimensions against registered image subsizes.
	 *
	 * @param string $image_size   The image size name.
	 * @param int    $actual_width  Actual width of the uploaded image.
	 * @param int    $actual_height Actual height of the uploaded image.
	 * @return true|WP_Error True if dimensions are valid for the size, WP_Error otherwise.
	 */
	private function validate_size_against_registered( $image_size, $actual_width, $actual_height ) {
		// Skip validation for special sizes.
		if ( in_array( $image_size, array( 'original', 'full' ), true ) ) {
			return true;
		}

		$registered_sizes = wp_get_registered_image_subsizes();

		if ( ! isset( $registered_sizes[ $image_size ] ) ) {
			// If size is not registered, allow it but don't validate dimensions.
			return true;
		}

		$registered_size = $registered_sizes[ $image_size ];
		$expected_width  = (int) $registered_size['width'];
		$expected_height = (int) $registered_size['height'];
		$crop            = ! empty( $registered_size['crop'] );

		// For cropped images, dimensions should match exactly (unless set to 0 which means any).
		if ( $crop ) {
			if ( 0 !== $expected_width && $actual_width !== $expected_width ) {
				return new WP_Error(
					'rest_invalid_subsize_dimensions',
					sprintf(
						/* translators: 1: Size name, 2: Expected width, 3: Actual width. */
						__( 'Image size "%1$s" width mismatch. Expected %2$d pixels, got %3$d pixels.', 'gutenberg' ),
						$image_size,
						$expected_width,
						$actual_width
					),
					array( 'status' => 400 )
				);
			}

			if ( 0 !== $expected_height && $actual_height !== $expected_height ) {
				return new WP_Error(
					'rest_invalid_subsize_dimensions',
					sprintf(
						/* translators: 1: Size name, 2: Expected height, 3: Actual height. */
						__( 'Image size "%1$s" height mismatch. Expected %2$d pixels, got %3$d pixels.', 'gutenberg' ),
						$image_size,
						$expected_height,
						$actual_height
					),
					array( 'status' => 400 )
				);
			}
		} else {
			// For non-cropped images, at least one dimension should be within the maximum.
			// Either width equals expected OR height equals expected (aspect ratio preservation).
			$width_valid  = 0 === $expected_width || $actual_width <= $expected_width;
			$height_valid = 0 === $expected_height || $actual_height <= $expected_height;

			if ( ! $width_valid && ! $height_valid ) {
				return new WP_Error(
					'rest_invalid_subsize_dimensions',
					sprintf(
						/* translators: 1: Size name, 2: Expected width, 3: Expected height, 4: Actual width, 5: Actual height. */
						__( 'Image size "%1$s" dimensions exceed maximum. Expected max %2$dx%3$d pixels, got %4$dx%5$d pixels.', 'gutenberg' ),
						$image_size,
						$expected_width,
						$expected_height,
						$actual_width,
						$actual_height
					),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Populates image meta from EXIF/IPTC data if available.
	 *
	 * @param string $file Path to the image file.
	 * @param array  $metadata Existing metadata array.
	 * @return array Updated metadata array with image_meta populated.
	 */
	private function populate_image_meta( $file, $metadata ) {
		// Only process image files.
		if ( ! file_exists( $file ) ) {
			return $metadata;
		}

		// Initialize image_meta if not present.
		if ( ! isset( $metadata['image_meta'] ) ) {
			$metadata['image_meta'] = array(
				'aperture'          => '0',
				'credit'            => '',
				'camera'            => '',
				'caption'           => '',
				'created_timestamp' => '0',
				'copyright'         => '',
				'focal_length'      => '0',
				'iso'               => '0',
				'shutter_speed'     => '0',
				'title'             => '',
				'orientation'       => '0',
				'keywords'          => array(),
			);
		}

		// Try to read EXIF data if the function is available.
		if ( function_exists( 'wp_read_image_metadata' ) ) {
			$image_meta = wp_read_image_metadata( $file );

			if ( $image_meta ) {
				// Merge the read metadata with existing, only updating empty values.
				foreach ( $image_meta as $key => $value ) {
					if ( isset( $metadata['image_meta'][ $key ] ) ) {
						// Only update if the existing value is empty/default.
						$existing = $metadata['image_meta'][ $key ];
						$is_empty = '' === $existing || '0' === $existing || 0 === $existing || ( is_array( $existing ) && empty( $existing ) );

						if ( $is_empty && ! empty( $value ) ) {
							$metadata['image_meta'][ $key ] = $value;
						}
					}
				}
			}
		}

		return $metadata;
	}

	/**
	 * Filters {@see 'wp_unique_filename'} during sideloads.
	 *
	 * {@see wp_unique_filename()} will always add numeric suffix if the name looks like a sub-size to avoid conflicts.
	 *
	 * Adding this closure to the filter helps work around this safeguard.
	 *
	 * Example: when uploading myphoto.jpeg, WordPress normally creates myphoto-150x150.jpeg,
	 * and when uploading myphoto-150x150.jpeg, it will be renamed to myphoto-150x150-1.jpeg
	 * However, here it is desired not to add the suffix in order to maintain the same
	 * naming convention as if the file was uploaded regularly.
	 *
	 * @link https://github.com/WordPress/wordpress-develop/blob/30954f7ac0840cfdad464928021d7f380940c347/src/wp-includes/functions.php#L2576-L2582
	 *
	 * @param string        $filename                 Unique file name.
	 * @param string        $ext                      File extension. Example: ".png".
	 * @param string        $dir                      Directory path.
	 * @param callable|null $unique_filename_callback Callback function that generates the unique file name.
	 * @param string[]      $alt_filenames            Array of alternate file names that were checked for collisions.
	 * @param int|string    $number                   The highest number that was used to make the file name unique
	 *                                                or an empty string if unused.
	 * @return string Filtered file name.
	 */
	private function filter_wp_unique_filename( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number, $attachment_filename ) {
		if ( empty( $number ) || ! $attachment_filename ) {
			return $filename;
		}

		$ext       = pathinfo( $filename, PATHINFO_EXTENSION );
		$name      = pathinfo( $filename, PATHINFO_FILENAME );
		$orig_name = pathinfo( $attachment_filename, PATHINFO_FILENAME );

		if ( ! $ext || ! $name ) {
			return $filename;
		}

		$matches = array();
		if ( preg_match( '/(.*)(-\d+x\d+)-' . $number . '$/', $name, $matches ) ) {
			$filename_without_suffix = $matches[1] . $matches[2] . ".$ext";
			if ( $matches[1] === $orig_name && ! file_exists( "$dir/$filename_without_suffix" ) ) {
				return $filename_without_suffix;
			}
		}

		return $filename;
	}

	/**
	 * Side-loads a media file without creating an attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function sideload_item( WP_REST_Request $request ) {
		$attachment_id = $request['id'];

		$post = $this->get_post( $attachment_id );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if (
			! wp_attachment_is_image( $post ) &&
			! wp_attachment_is( 'pdf', $post )
		) {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID, only images and PDFs can be sideloaded.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( ! $request['convert_format'] ) {
			// Prevent image conversion as that is done client-side.
			add_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		}

		// Get the file via $_FILES or raw data.
		$files   = $request->get_file_params();
		$headers = $request->get_headers();

		/*
		 * wp_unique_filename() will always add numeric suffix if the name looks like a sub-size to avoid conflicts.
		 * See https://github.com/WordPress/wordpress-develop/blob/30954f7ac0840cfdad464928021d7f380940c347/src/wp-includes/functions.php#L2576-L2582
		 * With the following filter we can work around this safeguard.
		 */

		$attachment_filename = get_attached_file( $attachment_id, true );
		$attachment_filename = $attachment_filename ? wp_basename( $attachment_filename ) : null;

		/**
		 * @param string        $filename                 Unique file name.
		 * @param string        $ext                      File extension. Example: ".png".
		 * @param string        $dir                      Directory path.
		 * @param callable|null $unique_filename_callback Callback function that generates the unique file name.
		 * @param string[]      $alt_filenames            Array of alternate file names that were checked for collisions.
		 * @param int|string    $number                   The highest number that was used to make the file name unique
		 *                                                or an empty string if unused.
		 * @return string Filtered file name.
		 */
		$filter_filename = function ( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number ) use ( $attachment_filename ) {
			return $this->filter_wp_unique_filename( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number, $attachment_filename );
		};

		add_filter( 'wp_unique_filename', $filter_filename, 10, 6 );

		$parent_post = get_post_parent( $attachment_id );

		$time = null;

		// Matches logic in media_handle_upload().
		// The post date doesn't usually matter for pages, so don't backdate this upload.
		if ( $parent_post && 'page' !== $parent_post->post_type && substr( $parent_post->post_date, 0, 4 ) > 0 ) {
			$time = $parent_post->post_date;
		}

		if ( ! empty( $files ) ) {
			$file = $this->upload_from_file( $files, $headers, $time );
		} else {
			$file = $this->upload_from_data( $request->get_body(), $headers, $time );
		}

		remove_filter( 'wp_unique_filename', $filter_filename );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );

		if ( is_wp_error( $file ) ) {
			return $file;
		}

		$type = $file['type'];
		$path = $file['file'];

		$image_size = $request['image_size'];

		// Get actual image dimensions.
		$size          = wp_getimagesize( $path );
		$actual_width  = $size ? (int) $size[0] : 0;
		$actual_height = $size ? (int) $size[1] : 0;

		// Validate dimensions if requested.
		if ( ! empty( $request['validate_dimensions'] ) ) {
			$expected_width  = isset( $request['expected_width'] ) ? (int) $request['expected_width'] : null;
			$expected_height = isset( $request['expected_height'] ) ? (int) $request['expected_height'] : null;

			$dimension_validation = $this->validate_image_dimensions(
				$actual_width,
				$actual_height,
				$expected_width,
				$expected_height
			);

			if ( is_wp_error( $dimension_validation ) ) {
				// Clean up the uploaded file on validation failure.
				wp_delete_file( $path );
				return $dimension_validation;
			}

			// Also validate against registered image subsizes.
			$subsize_validation = $this->validate_size_against_registered( $image_size, $actual_width, $actual_height );

			if ( is_wp_error( $subsize_validation ) ) {
				// Clean up the uploaded file on validation failure.
				wp_delete_file( $path );
				return $subsize_validation;
			}
		}

		$metadata = wp_get_attachment_metadata( $attachment_id, true );

		if ( ! $metadata ) {
			$metadata = array();
		}

		if ( 'original' === $image_size ) {
			$metadata['original_image'] = wp_basename( $path );

			// Populate image dimensions for original image if not set.
			if ( empty( $metadata['width'] ) && $actual_width > 0 ) {
				$metadata['width'] = $actual_width;
			}
			if ( empty( $metadata['height'] ) && $actual_height > 0 ) {
				$metadata['height'] = $actual_height;
			}
			if ( empty( $metadata['file'] ) ) {
				$metadata['file'] = _wp_relative_upload_path( $path );
			}

			// Populate image meta from EXIF/IPTC data for original images.
			$metadata = $this->populate_image_meta( $path, $metadata );
		} else {
			$metadata['sizes'] = $metadata['sizes'] ?? array();

			$metadata['sizes'][ $image_size ] = array(
				'width'     => $actual_width,
				'height'    => $actual_height,
				'file'      => wp_basename( $path ),
				'mime-type' => $type,
				'filesize'  => wp_filesize( $path ),
			);
		}

		wp_update_attachment_metadata( $attachment_id, $metadata );

		$response_request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			rest_get_route_for_post( $attachment_id )
		);

		$response_request['context'] = 'edit';

		if ( isset( $request['_fields'] ) ) {
			$response_request['_fields'] = $request['_fields'];
		}

		$response = $this->prepare_item_for_response( get_post( $attachment_id ), $response_request );

		$response->header( 'Location', rest_url( rest_get_route_for_post( $attachment_id ) ) );

		return $response;
	}
}
