import { forwardRef } from '@wordpress/element';
import type { ComponentPropsWithoutRef } from 'react';
import { useWidgetHost } from './widget-host';

type HostLinkProps = {
	href: string;
} & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >;

/**
 * Renders the host's link primitive when the href matches one of its routes,
 * falling back to a plain anchor otherwise.
 */
export const HostLink = forwardRef< HTMLAnchorElement, HostLinkProps >(
	function HostLink( { href, children, ...props }, ref ) {
		const { links } = useWidgetHost();

		if ( links ) {
			const path = links.match( href );

			if ( path !== null ) {
				const Link = links.Link;

				return (
					<Link ref={ ref } path={ path } { ...props }>
						{ children }
					</Link>
				);
			}
		}

		return (
			<a ref={ ref } href={ href } { ...props }>
				{ children }
			</a>
		);
	}
);