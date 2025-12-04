"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mockAddons, mockManpower } from "@/lib/data";
import { ShoppingBasket, Minus, Plus } from "lucide-react";

type CartItem = {
  id: string;
  quantity: number;
};

export function AddonsBooking() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleQuantityChange = (id: string, delta: number) => {
    setCart(currentCart => {
      const itemIndex = currentCart.findIndex(item => item.id === id);
      if (itemIndex > -1) {
        const newQuantity = currentCart[itemIndex].quantity + delta;
        if (newQuantity > 0) {
          const newCart = [...currentCart];
          newCart[itemIndex] = { ...newCart[itemIndex], quantity: newQuantity };
          return newCart;
        } else {
          return currentCart.filter(item => item.id !== id);
        }
      } else if (delta > 0) {
        return [...currentCart, { id, quantity: 1 }];
      }
      return currentCart;
    });
  };

  const getItemQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };
  
  const allItems = [...mockAddons, ...mockManpower];

  const totalPrice = cart.reduce((total, cartItem) => {
    const item = allItems.find(i => i.id === cartItem.id);
    return total + (item ? item.price * cartItem.quantity : 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <ShoppingBasket />
            Accessories & Manpower
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Accessories</h4>
            <div className="space-y-2">
                {mockAddons.map(addon => {
                    const quantity = getItemQuantity(addon.id);
                    return (
                        <div key={addon.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <addon.icon className="h-5 w-5 text-primary" />
                                <span>{addon.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">₹{addon.price}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(addon.id, -1)}><Minus className="h-4 w-4" /></Button>
                                <span className="w-4 text-center">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(addon.id, 1)}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
        <Separator />
         <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Manpower</h4>
            <div className="space-y-2">
                {mockManpower.map(person => {
                    const quantity = getItemQuantity(person.id);
                    return (
                        <div key={person.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <person.icon className="h-5 w-5 text-primary" />
                                <span>{person.name}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">₹{person.price}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(person.id, -1)} disabled={!person.available || quantity === 0}><Minus className="h-4 w-4" /></Button>
                                <span className="w-4 text-center">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(person.id, 1)} disabled={!person.available || quantity > 0}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-lg font-bold">Total: ₹{totalPrice}</span>
        <Button disabled={totalPrice === 0}>Add to Booking</Button>
      </CardFooter>
    </Card>
  );
}
