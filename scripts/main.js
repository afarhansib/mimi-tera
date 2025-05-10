import { world, system, ItemStack, BlockInventoryComponent } from "@minecraft/server";
import { MinecraftItemTypes } from "vanilla-data.js";
console.log('Mimi Tera loaded.')

// Set your chest coordinates here 932 63 -7030
const CHEST_POS = { x: 932, y: 63, z: -7030 };

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "mimi:tera") return;

    const match = event.message.match(/^page:(\d+)$/);
    if (!match) return;

    const page = parseInt(match[1]);
    const ITEMS = Object.values(MinecraftItemTypes); // Full item list
    const ITEMS_PER_PAGE = 54;
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    system.run(() => {
        try {
            const dimension = world.getDimension("overworld");
            const block = dimension.getBlock(CHEST_POS);
            if (!block) {
                console.warn("No block at chest location.");
                return;
            }

            const inventory = block.getComponent(BlockInventoryComponent.componentId);
            if (!inventory) {
                console.warn("Block is not a container.");
                return;
            }

            const container = inventory.container;
            if (!container) {
                console.warn("No inventory found.");
                return;
            }

            // Clear chest first
            for (let i = 0; i < container.size; i++) {
                container.setItem(i, undefined);
            }

            const batch = ITEMS.slice(start, end);
            for (let i = 0; i < batch.length; i++) {
                const id = batch[i];
                const item = new ItemStack(id, 1);
                container.setItem(i, item);
                console.warn(`item_slot:${i}:${id}`); // Log slot and ID
            }

            console.warn(`__next__ page:${page}`); // Signal Node.js to take screenshot and advance
        } catch (err) {
            console.warn("Error:", err);
        }
    });
});