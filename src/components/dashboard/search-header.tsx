
"use client"
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

type SearchHeaderProps = {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  onFindAvailability: () => void;
};

export function SearchHeader({ selectedDate, onDateChange, onFindAvailability }: SearchHeaderProps) {

    return (
        <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 via-purple-50 to-orange-100 p-8 flex flex-col justify-center items-start text-left">
             <div className="absolute inset-0 z-0">
                <div 
                    className="absolute right-0 bottom-0 w-1/2 h-full opacity-30"
                    style={{
                        backgroundImage: "url('https://firebasestudio.ai/explore/AVIT-Ground-Booking/gen-2-6-30-24/images/cricket-player-bg.png')",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'bottom right',
                        backgroundSize: 'contain'
                    }}
                ></div>
            </div>
            <div className="relative z-10 w-full lg:w-1/2">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-gray-800 leading-tight">
                    LET THE <span className="text-primary">GAME</span><br/>
                    BEGIN FIND<br/>
                    YOUR <span className="text-accent">GROUND</span>
                </h1>
                <p className="mt-4 text-lg text-gray-600">Ready to start the game together? Book the AVIT ground with ease.</p>
                <div className="mt-8 w-full max-w-md bg-white/80 p-3 rounded-full shadow-lg backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-12 text-base rounded-full text-muted-foreground font-normal justify-start bg-white/50 border-gray-200 hover:bg-white">
                                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                                    <span>{selectedDate ? format(selectedDate, "PPP") : "Select date"}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarPicker
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={onDateChange}
                                    disabled={(day) => day < new Date(new Date().toDateString())}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button size="lg" className="h-12 rounded-full font-bold text-lg bg-primary hover:bg-primary/90" onClick={onFindAvailability}>
                            <Search className="mr-2 h-5 w-5" />
                            Find Availability
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
