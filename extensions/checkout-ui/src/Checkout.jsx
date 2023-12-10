import React from 'react';
import {
	Banner,
	useApi,
	useTranslate,
	reactExtension,
	useCartLines,
	Checkbox,
	Button,
	Form,
} from '@shopify/ui-extensions-react/checkout';


export default reactExtension('purchase.checkout.block.render', () => <Extension />);

function Extension() {
	const translate = useTranslate();
	const { extension, checkoutToken } = useApi();
	const lineItems = useCartLines();

	const defaultSelectedProducts = () =>
		lineItems.map((item) => {
			return { id: item.id, isChecked: false };
		});

	const [selectedProducts, setSelectedProducts] = React.useState(defaultSelectedProducts);
	const [isCartEmptyWarning, setIsCartEmptyWarning] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(false);

	const handleCheckboxChange = (isChecked, id) => {
		setSelectedProducts((prevValue) =>
			prevValue.map((product) => {
				if (product.id === id) {
					product.isChecked = isChecked;
				}
				return product;
			})
		);
	};
	const handleSaveCart = async () => {
		setIsLoading(true);
		const baseUrl = extension.scriptUrl.split('.com')[0] + '.com';

		const selectedProductIds = selectedProducts
			.filter((product) => product.isChecked)
			.map((obj) => obj.id);
		// eslint-disable-next-line no-magic-numbers
		if (selectedProductIds.length === 0) {
			setIsCartEmptyWarning(true);
			setIsLoading(false);
			return;
		}
		try {

			const response = await fetch(`${baseUrl}/saveCart`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					checkoutToken: checkoutToken.current,
					selectedProductIds: selectedProductIds,
				}),
			});
			console.log('🚀 ~ file: Checkout.jsx:42 ~ handleSaveCart ~ response:', response);
		} catch (error) {
			console.log('🚀 ~ file: Checkout.jsx:43 ~ handleSaveCart ~ error:', error);
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<Banner title={translate('saveYourCart')}>
			{isCartEmptyWarning && <Banner status="warning" title="Must include items to be saved" />}
			<Form onSubmit={handleSaveCart}>
				{lineItems.map((product) => (
					<Checkbox
						key={product.id}
						value={selectedProducts.find((cur) => cur.id === product.id).isChecked}
						onChange={(isChecked) => handleCheckboxChange(isChecked, product.id)}
						id="checkbox"
					>
						{product.merchandise.title}
					</Checkbox>
				))}

				<Button loading={isLoading} accessibilityRole="submit">
					{translate('save')}
				</Button>
			</Form>
		</Banner>
	);
}
