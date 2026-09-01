import { useState } from "react"
import { TruckIcon, XIcon, ZapIcon } from "lucide-react"

const Banner = () => {
    const [bannerVisible, setBannerVisible] = useState(() => {
        return sessionStorage.getItem("banner_dismissed") !== "true"
    })

    const dismissBanner = () => {
        setBannerVisible(false)
        sessionStorage.setItem("banner_dismissed", "true")
    }

    return (
        <div>
            {bannerVisible && (
                <div className="bg-linear-to-r from-app-green via-emerald-800 to-app-green text-white text-xs sm:text-sm relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-center items-center relative">

                        <div className="flex items-center gap-2">
                            <TruckIcon className="size-4 shrink-0" />
                            <span className="font-medium">
                                Free delivery on orders above $20
                            </span>
                        </div>

                        <span className="hidden sm:inline text-white/40 ml-6">|</span>
                        <div className="hidden sm:flex items-center gap-2">
                            <ZapIcon className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                            <span>Farm-fresh produce delivered daily</span>
                        </div>

                        <button
                            onClick={dismissBanner}
                            className="absolute right-4 sm:right-6 lg:right-8 hover:opacity-75 transition-opacity"
                            aria-label="Dismiss banner"
                        >
                            <XIcon className="size-4 shrink-0" />
                        </button>

                    </div>
                </div>
            )}
        </div>
    )
}

export default Banner