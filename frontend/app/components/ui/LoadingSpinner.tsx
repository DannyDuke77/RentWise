'use client';

import React, { useState, useEffect } from 'react';

interface LoadingMessage {
    time: number; // seconds after which to show this message
    message: string;
}

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    label?: string;
    fullPage?: boolean;
    messages?: LoadingMessage[];
    showTimer?: boolean;
    showTimerAfter?: number;
    // Progress bar props
    progress?: number; // 0-100
    showProgress?: boolean;
    progressLabel?: string; // Custom label for progress (e.g., "Uploading: 45%")
    indeterminate?: boolean; // Show indeterminate progress bar
    progressColor?: string; // Custom progress bar color
}

const DEFAULT_MESSAGES: LoadingMessage[] = [
    { time: 10, message: "This is taking longer than expected..." },
    { time: 20, message: "Still working on it... Thanks for your patience" },
    { time: 30, message: "We're experiencing some delays, please hang on..." },
    { time: 35, message: "This is taking unusually long. Please check your connection." },
];

const LoadingSpinner = ({ 
    size = 'md', 
    color = 'blue-600', 
    label,
    fullPage = false,
    messages = DEFAULT_MESSAGES,
    showTimer = false,
    showTimerAfter = 5,
    progress,
    showProgress = false,
    progressLabel,
    indeterminate = false,
    progressColor = 'blue-600',
}: LoadingSpinnerProps) => {
    const [currentMessage, setCurrentMessage] = useState(
        label || messages[0]?.message
    );
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [shouldShowTimer, setShouldShowTimer] = useState(false);

    useEffect(() => {
        // Reset timer when label or messages change
        setElapsedSeconds(0);
        setCurrentMessage(label || messages[0]?.message);
        setShouldShowTimer(false);

        const timer = setInterval(() => {
            setElapsedSeconds(prev => {
                const newTime = prev + 1;
                
                // Show timer after threshold
                if (newTime >= showTimerAfter && !shouldShowTimer) {
                    setShouldShowTimer(true);
                }
                
                // Find the appropriate message for the current time
                const matchedMessage = [...messages]
                    .sort((a, b) => b.time - a.time)
                    .find(m => newTime >= m.time);
                
                if (matchedMessage) {
                    setCurrentMessage(matchedMessage.message);
                }
                
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [label, messages, showTimerAfter]);

    const sizes = {
        sm: 'h-6 w-6 border-2',
        md: 'h-10 w-10 border-3',
        lg: 'h-16 w-16 border-[4px]',
        xl: 'h-24 w-24 border-[6px]'
    };

    // Format progress percentage
    const formatProgress = (value?: number) => {
        if (value === undefined) return '0%';
        return `${Math.min(Math.max(value, 0), 100)}%`;
    };

    const getProgressColor = (value?: number) => {
        if (!value) return progressColor;
        if (value < 30) return 'red-500';
        if (value < 70) return 'yellow-500';
        return progressColor;
    };

    const spinnerContent = (
        <div className="flex flex-col items-center justify-center space-y-6 w-fit min-w-[200px]">
            {/* Spinner */}
            <div className="relative">
                {/* Outer Ring (Static Track) */}
                <div className={`${sizes[size]} rounded-full border-gray-100`}></div>
                
                {/* Inner Spinning Ring */}
                <div className={`absolute top-0 left-0 ${sizes[size]} rounded-full border-t-${color} border-r-transparent border-b-transparent border-l-transparent animate-spin duration-700`}></div>
                
                {/* Pulse Effect */}
                <div className={`absolute top-0 left-0 ${sizes[size]} rounded-full border-${color} opacity-20 animate-ping`}></div>
            </div>
            
            {/* Message */}
            {currentMessage && (
                <div className="flex flex-col items-center gap-1">
                    <p className={`text-sm text-center font-black uppercase tracking-widest text-gray-400 animate-pulse ${
                        elapsedSeconds > 10 ? 'text-amber-500' : ''
                    } ${elapsedSeconds > 20 ? 'text-red-400' : ''}`}>
                        {currentMessage}
                    </p>
                    
                    {/* Timer */}
                    {showTimer && shouldShowTimer && (
                        <p className="text-xs text-gray-500 font-mono">
                            {elapsedSeconds}s
                        </p>
                    )}
                </div>
            )}

            {/* Progress Bar */}
            {(showProgress || progress !== undefined) && (
                <div className="w-full space-y-2">
                    {/* Progress Label */}
                    {progressLabel && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{progressLabel}</span>
                            {!indeterminate && progress !== undefined && (
                                <span className="font-mono text-gray-600">
                                    {formatProgress(progress)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Progress Bar Track */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        {indeterminate ? (
                            // Indeterminate progress bar (animated)
                            <div 
                                className={`h-full bg-${progressColor} rounded-full animate-progress-indeterminate`}
                                style={{ width: '50%' }}
                            />
                        ) : (
                            // Determinate progress bar
                            <div 
                                className={`h-full bg-${getProgressColor(progress)} rounded-full transition-all duration-500 ease-out`}
                                style={{ 
                                    width: formatProgress(progress),
                                    transition: 'width 0.5s ease-in-out'
                                }}
                            />
                        )}
                    </div>

                    {/* Show percentage below */}
                    {!indeterminate && progress !== undefined && !progressLabel && (
                        <p className="text-xs text-center text-gray-400 font-mono">
                            {formatProgress(progress)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md p-4">
                {spinnerContent}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12 w-full px-4">
            {spinnerContent}
        </div>
    );
};

export default LoadingSpinner;