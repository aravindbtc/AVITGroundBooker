
"use client"
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAddons, mockManpower } from '@/lib/data';
import type { Addon, Manpower } from '@/lib/types';
import { ShieldAlert, Save } from "lucide-react";

export default function AdminPage() {
  const [addons, setAddons] = useState<Addon[]>(mockAddons);
  const [manpower, setManpower] = useState<Manpower[]>(mockManpower);

  const handleAddonUpdate = (id: string, field: 'price' | 'stock', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setAddons(addons.map(a => a.id === id ? { ...a, [field]: numValue } : a));
    }
  };

  const handleManpowerUpdate = (id: string, field: 'price' | 'stock', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setManpower(manpower.map(m => m.id === id ? { ...m, [field]: numValue } : m));
    }
  };

  return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Admin Panel: Price & Stock Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="accessories">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="accessories">Accessories</TabsTrigger>
              <TabsTrigger value="manpower">Manpower</TabsTrigger>
            </TabsList>
            <TabsContent value="accessories">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price (RS.)</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((addon) => (
                    <TableRow key={addon.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <addon.icon className="h-5 w-5 text-muted-foreground" />
                        {addon.name}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={addon.price}
                          onChange={(e) => handleAddonUpdate(addon.id, 'price', e.target.value)}
                          className="h-9 w-24"
                        />
                      </TableCell>
                       <TableCell>
                        <Input
                          type="number"
                          defaultValue={addon.stock}
                          onChange={(e) => handleAddonUpdate(addon.id, 'stock', e.target.value)}
                          className="h-9 w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="manpower">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Price (RS.)</TableHead>
                    <TableHead>Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manpower.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                         <person.icon className="h-5 w-5 text-muted-foreground" />
                        {person.name}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={person.price}
                          onChange={(e) => handleManpowerUpdate(person.id, 'price', e.target.value)}
                          className="h-9 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={person.stock}
                          onChange={(e) => handleManpowerUpdate(person.id, 'stock', e.target.value)}
                          className="h-9 w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end mt-6">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}
