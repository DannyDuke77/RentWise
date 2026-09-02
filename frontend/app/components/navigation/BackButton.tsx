'use client'

import { Property } from "@/app/src/types/Types"
import { CircleArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
    property: Property | null,
    label?: string
}

export default function BackButton({ property, label }: BackButtonProps) {
    return (
        <Link 
            href={`/properties/${property?.id}`}
            className="flex items-center space-x-2"
        >
            <CircleArrowLeft />
            <span>{label || 'Back'}</span>
        </Link>
    )
}