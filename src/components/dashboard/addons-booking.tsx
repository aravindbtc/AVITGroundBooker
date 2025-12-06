
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Minus, Plus, Users, ShieldCheck, Hammer, Orbit, ToyBrick, Shield, Award, Megaphone, User as UserIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { BookingItem, Addon, Manpower } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import React from "react";

interface AddonsBookingProps {
  bookingAddons: BookingItem[];
  onAddonsChange: (addons: BookingItem[]) => void;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'bat': Hammer,
    'ball': Orbit,
    'stumps': ToyBrick,
    'helmet': Shield,
    'pads': Award,
    'umpire': Megaphone,
    'coach': UserIcon,
};


export function AddonsBooking({ bookingAddons, onAddonsChange }: AddonsBookingProps) {
  const firestore = useFirestore();

  const accessoriesQuery = useMemoFirebase(() => firestore && collection(firestore, 'accessories'), [firestore]);
  const { data: accessoriesData, isLoading: accessoriesLoading } = useCollection<Addon>(accessoriesQuery);
  
  const manpowerQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'manpower'), where("availability", "==", true));
  }, [firestore]);
  const { data: manpowerData, isLoading: manpowerLoading } = useCollection<Manpower>(manpowerQuery);

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
        const type = 'quantity' in item ? 'addon' : 'manpower';
        return [...currentCart, { id: item.id, name: item.name, quantity: 1, price: item.price, type }];
      }
      return currentCart;
    });
  };

  const getItemQuantity = (id: string) => {
    return bookingAddons.find(item => item.id === id)?.quantity || 0;
  };

  const renderItems = (items: (Addon[] | Manpower[] | null | undefined), type: 'accessory' | 'manpower') => {
      if (!items) {
          return (
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-7" />
                </div>
            </div>
          )
      }

      return items.map((item: Addon | Manpower) => {
          const quantity = getItemQuantity(item.id);
          const stock = 'quantity' in item ? item.quantity : 1;
          const isSoldOut = stock <= 0;
          const isMaxed = quantity >= stock;
          const Icon = iconMap[item.id] || ShieldCheck;

          return (
              <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-primary/80" />
                      <span className="font-medium">{item.name}</span>
                       {isSoldOut && <Badge variant="destructive" className="text-xs">
                        {type === 'accessory' ? 'Sold Out' : 'Unavailable'}
                        </Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold w-20 text-right">RS.{item.price}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item, -1)} disabled={quantity === 0}><Minus className="h-4 w-4" /></Button>
                      <span className="w-5 text-center font-bold">{quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item, 1)} disabled={isSoldOut || isMaxed}><Plus className="h-4 w-4" /></Button>
                  </div>
              </div>
          )
      });
  }

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
                {renderItems(accessoriesData, 'accessory')}
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
                {renderItems(manpowerData, 'manpower')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
