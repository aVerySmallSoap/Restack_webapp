<script setup lang="ts">

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-vue-next';

</script>

<template>
    <HoverCard>
        <HoverCardTrigger>
            <Button size="icon" variant="link">
                <Info class="text-muted"/>
            </Button>
        </HoverCardTrigger>
        <HoverCardContent>
            <slot></slot>
        </HoverCardContent>
    </HoverCard>
</template>

