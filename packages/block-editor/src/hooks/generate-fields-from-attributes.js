/**
 * Generates DataForm field definitions from block attributes.
 *
 * This utility enables PHP-only blocks to have auto-generated inspector controls
 * by converting block attribute definitions into DataForm field definitions.
 *
 * Attribute schema validation is performed by `wp_mark_auto_generate_control_attributes()`
 * function, which marks eligible attributes with the `autoGenerateControl` flag. This
 * function processes only those pre-validated attributes.
 * See https://github.com/WordPress/wordpress-develop/blob/8f6d31266deecd7eea258bd3d45597355cce13d0/src/wp-includes/block-supports/auto-register.php#L30
 *
 * @param {Object} attributes - Block type attributes from block registration
 * @return {{ fields: Array, form: Object }} DataForm fields and form definitions
 */
export function generateFieldsFromAttributes( attributes ) {
	const fields = [];
	const fieldIds = [];

	Object.entries( attributes ).forEach( ( [ name, def ] ) => {
		if ( ! def.autoGenerateControl ) {
			return;
		}

		const field = createFieldFromAttribute( name, def );
		if ( field ) {
			fields.push( field );
			fieldIds.push( name );
		}
	} );

	return {
		fields,
		form: { fields: fieldIds },
	};
}

/**
 * Creates a DataForm field definition from a block attribute definition.
 *
 * @param {string} name - The attribute name
 * @param {Object} def  - The attribute definition from block.json
 * @return {Object|null} DataForm field definition or null if type not supported
 */
function createFieldFromAttribute( name, def ) {
	const type = def.type;
	const field = {
		id: name,
		label: def.label || name,
		// Only 'string' needs mapping to 'text'; others are 1:1 with DataForm types.
		// This mapping will be unnecessary once #74105 lands.
		type: type === 'string' ? 'text' : type,
	};

	// Add elements for enums (DataForm idiom)
	if ( type === 'array' && Array.isArray( def.items?.enum ) ) {
		field.elements = def.items.enum.map( ( value ) => ( {
			value,
			label: String( value ),
		} ) );
	} else if ( def.enum && Array.isArray( def.enum ) ) {
		field.elements = def.enum.map( ( value ) => ( {
			value,
			label: String( value ),
		} ) );
	}

	const isValid = getValidationRulesFromAttribute( def );
	if ( isValid ) {
		field.isValid = isValid;
	}

	return field;
}

/**
 * Maps the JSON Schema constraints of a block attribute definition to
 * DataForm validation rules, so that values the server would reject are
 * flagged on the corresponding control. Enum constraints don't need a rule:
 * DataForm validates fields with `elements` by default.
 *
 * @param {Object} def - The attribute definition from block.json
 * @return {Object|undefined} DataForm validation rules, if any apply.
 */
function getValidationRulesFromAttribute( def ) {
	const rules = {};

	if ( def.type === 'number' || def.type === 'integer' ) {
		if ( typeof def.minimum === 'number' ) {
			rules.min = def.minimum;
		}
		if ( typeof def.maximum === 'number' ) {
			rules.max = def.maximum;
		}
	}

	if ( def.type === 'string' ) {
		if ( Number.isInteger( def.minLength ) ) {
			rules.minLength = def.minLength;
		}
		if ( Number.isInteger( def.maxLength ) ) {
			rules.maxLength = def.maxLength;
		}
		if ( typeof def.pattern === 'string' ) {
			rules.pattern = def.pattern;
		}
	}

	return Object.keys( rules ).length ? rules : undefined;
}
