import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-visible rounded-full bg-muted select-none data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full shadow-[0_0_12px_-2px_var(--color-primary)] transition-[width] duration-150 ease-out"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="group relative block size-5 shrink-0 rounded-full border-2 border-primary-foreground bg-primary shadow-[0_2px_8px_rgba(0,0,0,0.4)] ring-primary/30 transition-[transform,box-shadow] duration-150 ease-out select-none after:absolute after:-inset-2 cursor-grab hover:scale-110 hover:shadow-[0_0_0_6px_var(--color-primary)/15,0_2px_12px_rgba(0,0,0,0.5)] focus-visible:scale-110 focus-visible:ring-4 focus-visible:outline-hidden active:scale-125 active:cursor-grabbing active:shadow-[0_0_0_8px_var(--color-primary)/20,0_4px_16px_rgba(0,0,0,0.5)] data-dragging:scale-125 data-dragging:shadow-[0_0_0_8px_var(--color-primary)/20,0_4px_16px_rgba(0,0,0,0.5)] disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
