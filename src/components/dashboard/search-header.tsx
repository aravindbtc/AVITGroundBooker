"use client"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";

export function SearchHeader() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585822754398-04873d4e1f50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxjcmlja2V0JTIwZ3JvdW5kfGVufDB8fHx8MTc2NDg0MDQxN3ww&ixlib=rb-4.1.0&q=80&w=1080')" }}
            ></div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center text-primary-foreground">
                <h1 className="text-4xl font-bold font-headline drop-shadow-md">Find & Book Your Game</h1>
                <p className="mt-2 text-lg drop-shadow-sm">Book the AVIT Cricket Ground in seconds</p>
                <div className="mt-6 w-full max-w-2xl bg-background/90 p-3 rounded-full shadow-2xl backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                        <div className="relative col-span-1 md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search for venues..." 
                                className="pl-10 h-12 text-base rounded-full border-none focus-visible:ring-primary focus-visible:ring-2"
                            />
                        </div>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-12 text-base rounded-full text-muted-foreground font-normal justify-start">
                                    <Calendar className="mr-2 h-5 w-5" />
                                    <span>{date ? format(date, "PPP") : "Select date"}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarPicker
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(day) => day < new Date(new Date().toDateString())}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button size="lg" className="h-12 rounded-full font-bold text-lg">
                            <Search className="mr-2 h-5 w-5" />
                            Find
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
