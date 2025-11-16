import { mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Update preview code for existing catalog components
 * This is a one-time migration mutation
 */
export const updateComponentPreviewCode = mutation({
  args: {
    componentId: v.string(),
    previewCode: v.string(),
  },
  handler: async (ctx, args) => {
    const component = await ctx.db
      .query('catalogComponents')
      .withIndex('by_componentId', (q) => q.eq('componentId', args.componentId))
      .first()
    
    if (!component) {
      throw new Error(`Component with ID ${args.componentId} not found`)
    }
    
    await ctx.db.patch(component._id, {
      previewCode: args.previewCode,
      updatedAt: Date.now(),
    })
    
    return { success: true, componentId: args.componentId }
  },
})

/**
 * Batch update all preview codes at once
 */
export const batchUpdatePreviewCodes = mutation({
  handler: async (ctx) => {
    const updates = [
      {
        componentId: 'k97cv18fkdsx1tgt5731ydfbth7twams',
        previewCode: `import { ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}`,
      },
      {
        componentId: 'k97ahk0d5364cf8vfspfp6c5557vhbj3',
        previewCode: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AccordionDemo() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Product Information</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            Our flagship product combines cutting-edge technology with sleek
            design. Built with premium materials, it offers unparalleled
            performance and reliability.
          </p>
          <p>
            Key features include advanced processing capabilities, and an
            intuitive user interface designed for both beginners and experts.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Shipping Details</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            We offer worldwide shipping through trusted courier partners.
            Standard delivery takes 3-5 business days, while express shipping
            ensures delivery within 1-2 business days.
          </p>
          <p>
            All orders are carefully packaged and fully insured. Track your
            shipment in real-time through our dedicated tracking portal.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Return Policy</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
          </p>
          <p>
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        componentId: 'k970dgdq6z1t6ppx09gpaz58z57vg9je',
        previewCode: `import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export function AvatarDemo() {
  return (
    <div className="flex flex-row flex-wrap items-center gap-12">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="rounded-lg">
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://github.com/maxleiter.png"
            alt="@maxleiter"
          />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://github.com/evilrabbit.png"
            alt="@evilrabbit"
          />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}`,
      },
    ]

    const results = []
    
    for (const update of updates) {
      const component = await ctx.db
        .query('catalogComponents')
        .withIndex('by_componentId', (q) => q.eq('componentId', update.componentId))
        .first()
      
      if (component) {
        await ctx.db.patch(component._id, {
          previewCode: update.previewCode,
          updatedAt: Date.now(),
        })
        results.push({ success: true, componentId: update.componentId })
      } else {
        results.push({ success: false, componentId: update.componentId, error: 'Not found' })
      }
    }
    
    return results
  },
})

