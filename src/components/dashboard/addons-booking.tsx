
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Minus, Plus, Users, ShieldCheck, Hammer, Orbit, ToyBrick, Shield, Award, Megaphone, User as UserIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { BookingItem, Slot } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import React, { useMemo } from "react";
import { isSameDay } from "date-fns";

interface AddonsBookingProps {
  bookingAddons: BookingItem[];
  onAddonsChange: (addons: BookingItem[]) => void;
  selectedDate: Date;
  bookedSlots: Slot[];
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

type ItemForBooking = {
    id: string;
    name: string;
    price: number;
    stock: number;
    type: 'item' | 'manpower';
    contact?: string;
};


export function AddonsBooking({ bookingAddons, onAddonsChange, selectedDate, bookedSlots }: AddonsBookingProps) {
  const firestore = useFirestore();

  const accessoriesQuery = useMemoFirebase(() => firestore && query(collection(firestore, 'accessories')), [firestore]);
  const { data: allItems, isLoading: dataLoading } = useCollection<ItemForBooking>(accessoriesQuery);
  
  const accessoriesData = allItems?.filter(item => item.type === 'item');
  const manpowerData = allItems?.filter(item => item.type === 'manpower');

  // Find which manpower resources are already booked for the selected date
  const busyManpowerIds = useMemo(() => {
      const busyIds = new Set<string>();
      if (!bookedSlots || bookedSlots.length === 0) {
          return busyIds;
      }
      
      const relevantSlots = bookedSlots.filter(slot => isSameDay(slot.startAt, selectedDate));

      relevantSlots.forEach(slot => {
           slot.addons?.forEach(addon => {
               if (addon.type === 'manpower') {
                   busyIds.add(addon.id);
               }
           })
      });
      return busyIds;
  }, [bookedSlots, selectedDate]);

  const handleQuantityChange = (item: ItemForBooking, delta: number) => {
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
        return [...currentCart, { id: item.id, name: item.name, quantity: 1, price: item.price, type: item.type, contact: item.contact }];
      }
      return currentCart;
    });
  };

  const getItemQuantity = (id: string) => {
    return bookingAddons.find(item => item.id === id)?.quantity || 0;
  };

  const renderItems = (items: ItemForBooking[] | null | undefined, type: 'item' | 'manpower') => {
      if (!items) {
          return (
             <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
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
                ))}
             </div>
          )
      }

      return items.map((item: ItemForBooking) => {
          const quantity = getItemQuantity(item.id);
          
          let isSoldOut = false;
          let isMaxed = false;
          
          if (item.type === 'manpower') {
              isSoldOut = busyManpowerIds.has(item.id);
              isMaxed = quantity >= 1;
          } else {
              isSoldOut = item.stock <= 0;
              isMaxed = quantity >= item.stock;
          }
          
          const Icon = iconMap[item.name.toLowerCase()] || ShieldCheck;

          return (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                  quantity > 0 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300' 
                    : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                } ${isSoldOut && quantity === 0 ? 'opacity-60' : ''}`}
              >
                  <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${quantity > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Icon className={`h-6 w-6 ${quantity > 0 ? 'text-green-600' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        {(isSoldOut && quantity === 0) && (
                          <Badge variant="destructive" className="text-xs ml-2 inline-block">
                            {type === 'item' ? 'Sold Out' : 'Unavailable'}
                          </Badge>
                        )}
                        {quantity > 0 && (
                          <Badge variant="secondary" className="text-xs ml-2 inline-block bg-green-200 text-green-800 hover:bg-green-300">
                            Added
                          </Badge>
                        )}
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-green-600 min-w-fit">₹{item.price}</span>
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-gray-600 hover:bg-white" 
                          onClick={() => handleQuantityChange(item, -1)} 
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center font-bold text-slate-700">{quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-gray-600 hover:bg-white hover:text-green-600" 
                          onClick={() => handleQuantityChange(item, 1)} 
                          disabled={isSoldOut || isMaxed}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
              </div>
          )
      });
  }

  return (
    <Card className="shadow-xl rounded-xl border-0 overflow-hidden bg-gradient-to-br from-slate-50 to-green-50">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-6">
        <CardTitle className="font-headline flex items-center gap-3 text-2xl">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShoppingBasket className="h-6 w-6" />
            </div>
            Add Accessories & Manpower
        </CardTitle>
        <p className="text-green-100 text-sm mt-2">Enhance your booking with additional items and services</p>
      </CardHeader>
      <CardContent className="pt-8">
        <Accordion type="multiple" defaultValue={['accessories', 'manpower']} className="w-full space-y-4">
          <AccordionItem value="accessories" className="border-0 bg-white rounded-lg shadow-md border-l-4 border-l-green-500 px-4 data-[state=open]:shadow-lg transition-all duration-300">
            <AccordionTrigger className="text-lg font-bold font-headline text-slate-700 hover:text-green-600 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-green-600"/>
                    </div>
                    <span>Sports Accessories</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-4 space-y-4 border-t border-gray-200">
                {dataLoading ? <Skeleton className="h-10"/> : renderItems(accessoriesData, 'item')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="manpower" className="border-0 bg-white rounded-lg shadow-md border-l-4 border-l-blue-500 px-4 data-[state=open]:shadow-lg transition-all duration-300">
            <AccordionTrigger className="text-lg font-bold font-headline text-slate-700 hover:text-blue-600 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600"/>
                    </div>
                    <span>Professional Services</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-4 space-y-4 border-t border-gray-200">
                {dataLoading ? <Skeleton className="h-10"/> : renderItems(manpowerData, 'manpower')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

    