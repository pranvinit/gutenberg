/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Skeleton } from '..';

describe( 'Skeleton', () => {
	it( 'should render with default props', () => {
		const { container } = render( <Skeleton /> );

		// eslint-disable-next-line testing-library/no-node-access
		const skeleton = container.firstChild;

		expect( skeleton ).toBeInTheDocument();
		expect( skeleton ).toHaveClass( 'components-skeleton' );
		expect( skeleton ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'should apply custom className', () => {
		const { container } = render(
			<Skeleton className="custom-skeleton" />
		);

		// eslint-disable-next-line testing-library/no-node-access
		const skeleton = container.firstChild;

		expect( skeleton ).toHaveClass( 'components-skeleton' );
		expect( skeleton ).toHaveClass( 'custom-skeleton' );
	} );

	it( 'should apply custom width and height styles', () => {
		const { container } = render(
			<Skeleton width="200px" height="50px" />
		);

		// eslint-disable-next-line testing-library/no-node-access
		const skeleton = container.firstChild;

		expect( skeleton ).toHaveStyle( {
			width: '200px',
			height: '50px',
		} );
	} );

	it( 'should apply aspect ratio when provided', () => {
		const { container } = render(
			<Skeleton width="100%" aspectRatio="16/9" />
		);

		// eslint-disable-next-line testing-library/no-node-access
		const skeleton = container.firstChild;

		expect( skeleton ).toHaveStyle( {
			width: '100%',
			height: 'auto',
			aspectRatio: '16/9',
		} );
	} );

	it( 'should be hidden from screen readers', () => {
		render( <Skeleton data-testid="skeleton" /> );

		const skeleton = screen.getByTestId( 'skeleton' );

		expect( skeleton ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'should forward ref to the DOM element', () => {
		const ref = { current: null };
		render( <Skeleton ref={ ref } data-testid="skeleton" /> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'should pass additional props to the underlying element', () => {
		render( <Skeleton data-testid="skeleton" data-custom="value" /> );

		const skeleton = screen.getByTestId( 'skeleton' );

		expect( skeleton ).toHaveAttribute( 'data-custom', 'value' );
	} );
} );
