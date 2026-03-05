'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Calendar, Loader2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "../ui/separator";

const TIME_SLOTS = [
    { startHour: 6, endHour: 8, label: "6:00 AM - 8:00 AM" },
    { startHour: 8, endHour: 10, label: "8:00 AM - 10:00 AM" },
    { startHour: 10, endHour: 12, label: "10:00 AM - 12:00 PM" },
    { startHour: 12, endHour: 14, label: "12:00 PM - 2:00 PM" },
    { startHour: 14, endHour: 16, label: "2:00 PM - 4:00 PM" },
    { startHour: 16, endHour: 18, label: "4:00 PM - 6:00 PM" },
    { startHour: 18, endHour: 20, label: "6:00 PM - 8:00 PM" },
    { startHour: 20, endHour: 22, label: "8:00 PM - 10:00 PM" },
];

export function SlotGeneration() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [basePrice, setBasePrice] = useState(999.5);
    const [selectedSlots, setSelectedSlots] = useState<number[]>(Array.from({ length: TIME_SLOTS.length }, (_, i) => i));
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [skipWeekends, setSkipWeekends] = useState(false);

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDateString = (year: number, month: number, day: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const isWeekend = (year: number, month: number, day: number) => {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    };

    const handleToggleDate = (dateStr: string) => {
        const newDates = new Set(selectedDates);
        if (newDates.has(dateStr)) {
            newDates.delete(dateStr);
        } else {
            newDates.add(dateStr);
        }
        setSelectedDates(newDates);
    };

    const handleSelectAllWeekdays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(currentMonth);
        const newDates = new Set<string>();

        for (let day = 1; day <= daysInMonth; day++) {
            if (!isWeekend(year, month, day)) {
                newDates.add(formatDateString(year, month, day));
            }
        }
        setSelectedDates(newDates);
    };

    const handleSelectAll = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(currentMonth);
        const newDates = new Set<string>();

        for (let day = 1; day <= daysInMonth; day++) {
            newDates.add(formatDateString(year, month, day));
        }
        setSelectedDates(newDates);
    };

    const handleClearAll = () => {
        setSelectedDates(new Set());
    };

    const handleToggleSlot = (index: number) => {
        setSelectedSlots(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleGenerateSlots = async () => {
        if (selectedDates.size === 0 || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select at least one date.'
            });
            return;
        }

        if (selectedSlots.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select at least one time slot.'
            });
            return;
        }

        setIsGenerating(true);
        try {
            const slotsRef = collection(firestore, 'slots');
            let successCount = 0;
            
            for (const dateStr of Array.from(selectedDates).sort()) {
                const [year, month, day] = dateStr.split('-').map(Number);
                const dateObj = new Date(year, month - 1, day);
                
                for (const slotIndex of selectedSlots) {
                    const slot = TIME_SLOTS[slotIndex];
                    const startDate = new Date(dateObj);
                    startDate.setHours(slot.startHour, 0, 0, 0);
                    
                    const endDate = new Date(dateObj);
                    endDate.setHours(slot.endHour, 0, 0, 0);

                    await addDoc(slotsRef, {
                        date: dateStr,
                        startAt: Timestamp.fromDate(startDate),
                        endAt: Timestamp.fromDate(endDate),
                        status: 'available',
                        price: basePrice,
                        groundId: 'avit-ground',
                        createdAt: Timestamp.now(),
                    });
                    successCount++;
                }
            }

            toast({
                title: 'Success!',
                description: `Created ${successCount} slots for ${selectedDates.size} date(s)`,
            });

            // Reset form
            setSelectedDates(new Set());
            setSelectedSlots(Array.from({ length: TIME_SLOTS.length }, (_, i) => i));

        } catch (error: any) {
            console.error('Slot generation error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not create slots. Please try again.',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Calendar className="h-6 w-6 text-primary" />
                    Bulk Slot Generation
                </CardTitle>
                <CardDescription>
                    Create time slots for multiple dates at once. Select dates from the calendar below.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="slot-price">Price per Slot (₹)</Label>
                    <Input 
                        id="slot-price"
                        type="number" 
                        step="0.5"
                        value={basePrice}
                        onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                        disabled={isGenerating}
                    />
                </div>

                <Separator />

                {/* Calendar Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{monthName}</h3>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(year, month - 1))}
                                disabled={isGenerating}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(year, month + 1))}
                                disabled={isGenerating}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-muted-foreground mb-2">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }
                            const dateStr = formatDateString(year, month, day);
                            const isSelected = selectedDates.has(dateStr);
                            const isWeekendDay = isWeekend(year, month, day);
                            
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleToggleDate(dateStr)}
                                    disabled={isGenerating || (skipWeekends && isWeekendDay)}
                                    className={`aspect-square rounded-lg font-semibold transition-all flex items-center justify-center relative ${
                                        isSelected
                                            ? 'bg-primary text-white border-2 border-primary'
                                            : isWeekendDay && skipWeekends
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white border-2 border-gray-200 hover:border-primary hover:bg-primary/5'
                                    } disabled:opacity-50`}
                                >
                                    {day}
                                    {isSelected && <CheckCircle className="h-4 w-4 absolute top-0 right-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleSelectAllWeekdays}
                            disabled={isGenerating}
                        >
                            Select All Weekdays
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={isGenerating}
                        >
                            Select All Days
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleClearAll}
                            disabled={isGenerating}
                        >
                            Clear Selection
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Time Slots Selection */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-3">Select Time Slots to Create</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {TIME_SLOTS.map((slot, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleToggleSlot(index)}
                                    disabled={isGenerating}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        selectedSlots.includes(index)
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    } disabled:opacity-50`}
                                >
                                    <div className="text-sm font-medium">{slot.label}</div>
                                    {selectedSlots.includes(index) && (
                                        <CheckCircle className="h-4 w-4 text-primary mt-1" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Selected: {selectedSlots.length} time slot{selectedSlots.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handleGenerateSlots}
                    disabled={isGenerating || selectedDates.size === 0 || selectedSlots.length === 0}
                    className="w-full"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating {selectedDates.size * selectedSlots.length} Slots...
                        </>
                    ) : (
                        <>
                            <Calendar className="mr-2 h-4 w-4" />
                            Generate {selectedDates.size * selectedSlots.length} Slot{selectedDates.size * selectedSlots.length !== 1 ? 's' : ''} ({selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''})
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
