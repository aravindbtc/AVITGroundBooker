
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockAddons, mockManpower } from "@/lib/data";
import { ShoppingBasket, Minus, Plus, Users, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { BookingItem, Addon, Manpower } from "@/lib/types";

interface AddonsBookingProps {
  bookingAddons: BookingItem[];
  onAddonsChange: (addons: BookingItem[]) => void;
}

export function AddonsBooking({ bookingAddons, onAddonsChange }: AddonsBookingProps) {

  const allItems: (Addon | Manpower)[] = [...mockAddons, ...mockManpower];

  const handleQuantityChange = (item: Addon | Manpower, delta: number) => {
    onAddonsChange(currentCart => {
      const itemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);
      if (itemIndex > -1) {
        const newQuantity = currentCart[itemIndex].quantity + delta;
        if (newQuantity > 0) {
          const newCart = [...currentCart];
          newCart[itemIndex] = { ...newCart[itemIndex], quantity: newQuantity };
          return newCart;
        } else {
          return currentCart.filter(cartItem => cartItem.id !== item.id);
        }
      } else if (delta > 0) {
        return [...currentCart, { id: item.id, name: item.name, quantity: 1, price: item.price, type: 'addon' }];
      }
      return currentCart;
    });
  };

  const getItemQuantity = (id: string) => {
    return bookingAddons.find(item => item.id === id)?.quantity || 0;
  };
  
  const totalPrice = bookingAddons.reduce((total, cartItem) => {
    return total + (cartItem.price * cartItem.quantity);
  }, 0);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline flex items-center gap-3">
            <ShoppingBasket className="h-6 w-6 text-primary" />
            Book Add-Ons
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
                    const isSoldOut = addon.stock <= 0;
                    const isMaxed = quantity >= addon.stock;

                    return (
                        <div key={addon.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <addon.icon className="h-6 w-6 text-primary/80" />
                                <span className="font-medium">{addon.name}</span>
                                 {isSoldOut && <Badge variant="destructive" className="text-xs">Sold Out</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold w-20 text-right">RS.{addon.price}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(addon, -1)} disabled={quantity === 0}><Minus className="h-4 w-4" /></Button>
                                <span className="w-5 text-center font-bold">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(addon, 1)} disabled={isSoldOut || isMaxed}><Plus className="h-4 w-4" /></Button>
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
                    const isSoldOut = person.stock <= 0;
                    const isMaxed = quantity >= person.stock;

                    return (
                        <div key={person.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <person.icon className="h-6 w-6 text-primary/80" />
                                <span className="font-medium">{person.name}</span>
                                {isSoldOut && <Badge variant="destructive" className="text-xs">Unavailable</Badge>}
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold w-20 text-right">RS.{person.price}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(person, -1)} disabled={quantity === 0}><Minus className="h-4 w-4" /></Button>
                                <span className="w-5 text-center font-bold">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(person, 1)} disabled={isSoldOut || isMaxed}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )
                })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
