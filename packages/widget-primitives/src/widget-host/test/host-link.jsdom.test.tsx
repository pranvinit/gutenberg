import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { createRef, forwardRef } from '@wordpress/element';
import type { ComponentPropsWithoutRef } from 'react';
import { HostLink } from '../host-link';
import { WidgetHostProvider } from '../widget-host';
import type { WidgetHostLinks } from '../widget-host';

const MATCHED_HREF = 'admin.php?page=dashboard&p=/reports';
const MATCHED_PATH = '/reports';

const RouteLink = forwardRef<
	HTMLAnchorElement,
	{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >
>( function RouteLink( { path, children, ...props }, ref ) {
	return (
		<a ref={ ref } href={ path } data-host-link="true" { ...props }>
			{ children }
		</a>
	);
} );

const links: WidgetHostLinks = {
	match: ( href ) => ( href === MATCHED_HREF ? MATCHED_PATH : null ),
	Link: RouteLink,
};

describe( 'HostLink', () => {
	it( 'renders the host link and forwards its ref when the href matches', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<WidgetHostProvider value={ { links } }>
				<HostLink ref={ ref } href={ MATCHED_HREF } className="report">
					Reports
				</HostLink>
			</WidgetHostProvider>
		);

		const link = screen.getByRole( 'link', { name: 'Reports' } );
		expect( link ).toHaveAttribute( 'data-host-link', 'true' );
		expect( link ).toHaveAttribute( 'href', MATCHED_PATH );
		expect( link ).toHaveClass( 'report' );
		expect( ref.current ).toBe( link );
	} );

	it( 'renders a plain anchor and forwards its ref when the href does not match', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<WidgetHostProvider value={ { links } }>
				<HostLink
					ref={ ref }
					href="https://example.com/reports"
					className="report"
				>
					Reports
				</HostLink>
			</WidgetHostProvider>
		);

		const link = screen.getByRole( 'link', { name: 'Reports' } );
		expect( link ).not.toHaveAttribute( 'data-host-link' );
		expect( link ).toHaveAttribute(
			'href',
			'https://example.com/reports'
		);
		expect( link ).toHaveClass( 'report' );
		expect( ref.current ).toBe( link );
	} );

	it( 'renders a plain anchor without a host provider', () => {
		render( <HostLink href="/reports">Reports</HostLink> );

		expect(
			screen.getByRole( 'link', { name: 'Reports' } )
		).toHaveAttribute( 'href', '/reports' );
	} );
} );