import React, { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
}

export const App = () => {
  // TypeScript finding: Excessive use of any
  const [data, setData] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Quality finding: loose equality
    if (cart.length == 0) {
      console.log("Cart is currently empty");
    }
  }, [cart]);

  const handleCheckout = (userPayload: any) => {
    // Security finding: console log of potentially sensitive payload
    console.log("Checking out payload:", userPayload);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Storefront Checkout</h1>
      <p>Items in cart: {cart.length}</p>
    </div>
  );
};
