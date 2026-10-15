export interface Coupon {
  id: string;
  code: string;
  text: string;
  discount: string;
}

export const coupons: Coupon[] = [
  {
    id: '1',
    code: 'TRYWROGN',
    discount: '₹100 OFF',
    text: 'GET ₹100 OFF ON YOUR 1ST PURCHASE (USE CODE: TRYWROGN) →',
  },
  {
    id: '2',
    code: 'MENEXPRESS20',
    discount: 'FLAT 20% OFF',
    text: 'FLAT 20% OFF ON ALL NEW ARRIVALS (USE CODE: MENEXPRESS20) →',
  },
  {
    id: '3',
    code: 'FREESHIP99',
    discount: 'FREE SHIPPING',
    text: 'FREE EXPRESS SHIPPING ON ORDERS ABOVE ₹999 (USE CODE: FREESHIP99) →',
  },
];
