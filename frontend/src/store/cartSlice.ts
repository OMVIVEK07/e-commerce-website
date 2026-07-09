import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  _id?: string;
  product: {
    _id: string;
    name: string;
    brand: string;
    price: number;
    discount: number;
    images: string[];
    stock: number;
  };
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    weight?: string;
  };
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  gst: number;
  shippingCharges: number;
  grandTotal: number;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  discountAmount: 0,
  couponCode: null,
  gst: 0,
  shippingCharges: 0,
  grandTotal: 0,
};

const calculateTotals = (state: CartState) => {
  let subtotal = 0;
  state.items.forEach((item) => {
    const discountedPrice = item.product.price * (1 - item.product.discount / 100);
    subtotal += discountedPrice * item.quantity;
  });

  state.subtotal = Number(subtotal.toFixed(2));

  // If subtotal is 0, empty coupon
  if (state.subtotal === 0) {
    state.discountAmount = 0;
    state.couponCode = null;
  }

  const taxedAmount = Math.max(state.subtotal - state.discountAmount, 0);
  state.gst = Number((taxedAmount * 0.18).toFixed(2)); // 18% GST
  state.shippingCharges = taxedAmount > 999 || taxedAmount === 0 ? 0 : 99;
  state.grandTotal = Number((taxedAmount + state.gst + state.shippingCharges).toFixed(2));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.discountAmount = 0;
      state.couponCode = null;
      state.gst = 0;
      state.shippingCharges = 0;
      state.grandTotal = 0;
    },
    applyCoupon: (
      state,
      action: PayloadAction<{ code: string; discountAmount: number }>
    ) => {
      state.couponCode = action.payload.code;
      state.discountAmount = action.payload.discountAmount;
      calculateTotals(state);
    },
    removeCoupon: (state) => {
      state.couponCode = null;
      state.discountAmount = 0;
      calculateTotals(state);
    },
  },
});

export const { setCart, clearCart, applyCoupon, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;
