
"use client"

const CricketIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 2a10 10 0 0 0-7.5 16.8" />
    <path d="M2.2 12h19.6" />
  </svg>
);


export function SportSelector() {
    const sports = [
        { name: "Cricket", icon: <CricketIcon /> },
    ]

    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Select a Sport</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sports.map(sport => (
                    <div key={sport.name} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-primary bg-card shadow-lg transition-all cursor-pointer">
                        <div className="h-12 w-12 text-primary">
                            {sport.icon}
                        </div>
                        <p className="font-semibold text-center">{sport.name}</p>
                    </div>
                ))}
                 <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed bg-card/50 text-muted-foreground">
                    <div className="h-12 w-12 text-muted-foreground/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                    <p className="font-semibold text-center text-sm">More Soon</p>
                </div>
            </div>
        </div>
    )
}
