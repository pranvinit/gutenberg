import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Text } from '../index';
import styles from '../style.module.css';

describe( 'Text', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <Text ref={ ref }>Content</Text> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders children', () => {
		render( <Text>Hello world</Text> );

		expect( screen.getByText( 'Hello world' ) ).toBeVisible();
	} );

	it( 'forwards props to the rendered element', () => {
		render( <Text data-testid="text">Content</Text> );

		expect( screen.getByTestId( 'text' ) ).toBeInTheDocument();
	} );

	it( 'forwards the className to the rendered element', () => {
		render(
			<Text data-testid="text" className="custom-class">
				Content
			</Text>
		);

		expect( screen.getByTestId( 'text' ) ).toHaveClass( 'custom-class' );
	} );

	it( 'supports the render prop', () => {
		render( <Text render={ <h2 /> }>Section title</Text> );

		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Section title' } )
		).toBeVisible();
	} );

	it( 'supports single-line truncation', () => {
		render(
			<Text data-testid="text" truncate>
				A very long piece of content
			</Text>
		);

		expect( screen.getByTestId( 'text' ) ).toHaveClass( styles.truncate );
	} );

	it( 'supports multi-line truncation', () => {
		render(
			<Text data-testid="text" numberOfLines={ 2 }>
				A very long piece of content that should span multiple lines.
			</Text>
		);

		expect( screen.getByTestId( 'text' ) ).toHaveClass( styles.lineClamp );
		expect( screen.getByTestId( 'text' ) ).toHaveStyle( {
			WebkitLineClamp: '2',
		} );
	} );
} );
