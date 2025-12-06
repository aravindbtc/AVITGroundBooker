"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mockAddons, mockManpower } from "@/lib/data";
import { ShoppingBasket, Minus, Plus, Users, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


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
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline flex items-center gap-3">
            <ShoppingBasket className="h-6 w-6 text-primary" />
            Add-Ons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['accessories', 'manpower']} className="w-full">
          <AccordionItem value="accessories">
            <AccordionTrigger className="text-lg font-semibold font-headline">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary"/>
                    Accessories
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
                {mockAddons.map(addon => {
                    const quantity = getItemQuantity(addon.id);
                    return (
                        <div key={addon.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <addon.icon className="h-6 w-6 text-primary/80" />
                                <span className="font-medium">{addon.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold w-16 text-right">&#8377;{addon.price}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(addon.id, -1)}><Minus className="h-4 w-4" /></Button>
                                <span className="w-5 text-center font-bold">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(addon.id, 1)}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )
                })}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="manpower">
            <AccordionTrigger className="text-lg font-semibold font-headline">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary"/>
                    Manpower
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
                {mockManpower.map(person => {
                    const quantity = getItemQuantity(person.id);
                    return (
                        <div key={person.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <person.icon className="h-6 w-6 text-primary/80" />
                                <span className="font-medium">{person.name}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold w-16 text-right">&#8377;{person.price}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(person.id, -1)} disabled={quantity === 0}><Minus className="h-4 w-4" /></Button>
                                <span className="w-5 text-center font-bold">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(person.id, 1)} disabled={!person.available || quantity > 0}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )
                })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
       {totalPrice > 0 && (
        <CardFooter className="flex items-center justify-between mt-4 bg-slate-50 -mx-6 -mb-6 p-6">
            <span className="text-xl font-bold font-headline">Total: &#8377;{totalPrice}</span>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">Add to Booking</Button>
        </CardFooter>
      )}
    </Card>
  );
}
