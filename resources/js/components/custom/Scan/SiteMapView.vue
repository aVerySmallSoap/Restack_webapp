<script setup lang="ts">
import { ref, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Globe, FileText, Link2Off } from 'lucide-vue-next'

const props = defineProps<{
    siteMap: Record<string, any> | null | undefined
    endpoints?: string[]
    outOfScope?: string[]
    ports?: number[]
}>()

interface TreeNode {
    name: string
    path: string
    children: TreeNode[]
    isLeaf: boolean
}

function joinPath(parent: string, child: string) {
    const p = parent.endsWith('/') ? parent.slice(0, -1) : parent
    const c = child.startsWith('/') ? child.slice(1) : child
    if (!p) return '/' + c
    return p + '/' + c
}

function buildTree(map: Record<string, any>, parentPath = ''): TreeNode[] {
    const nodes = Object.entries(map).map(([key, value]) => {
        const name = key || '/'
        const fullPath = parentPath ? joinPath(parentPath, key) : (key === '/' ? '/' : '/' + key)
        const children =
            value && typeof value === 'object' && Object.keys(value).length > 0
                ? buildTree(value, fullPath === '//' ? '/' : fullPath)
                : []

        return {
            name,
            path: fullPath === '//' ? '/' : fullPath,
            children,
            isLeaf: children.length === 0,
        }
    })

    // folders first, then alphabetical
    nodes.sort((a, b) => {
        if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1
        return a.name.localeCompare(b.name)
    })

    return nodes
}

const treeNodes = computed<TreeNode[]>(() => {
    if (!props.siteMap) return []
    const root = props.siteMap['/'] ?? props.siteMap
    return buildTree(root, '/')
})

const expandedPaths = ref<Set<string>>(new Set(['/']))

function toggle(path: string) {
    if (expandedPaths.value.has(path)) expandedPaths.value.delete(path)
    else expandedPaths.value.add(path)
}

function expandAll(nodes: TreeNode[]) {
    nodes.forEach(n => {
        expandedPaths.value.add(n.path)
        if (n.children.length) expandAll(n.children)
    })
}

function collapseAll() {
    expandedPaths.value.clear()
    expandedPaths.value.add('/')
}

const endpointSearch = ref('')
const activeTab = ref<'tree' | 'list' | 'oos'>('tree')

const filteredEndpoints = computed(() =>
    (props.endpoints ?? []).filter(e =>
        !endpointSearch.value || e.toLowerCase().includes(endpointSearch.value.toLowerCase()),
    ),
)

const filteredOos = computed(() =>
    (props.outOfScope ?? []).filter(e =>
        !endpointSearch.value || e.toLowerCase().includes(endpointSearch.value.toLowerCase()),
    ),
)

const stats = computed(() => ({
    endpoints: props.endpoints?.length ?? 0,
    outOfScope: props.outOfScope?.length ?? 0,
    ports: props.ports?.length ?? 0,
}))
</script>

<template>
    <div class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border p-3 text-center">
                <p class="text-2xl font-bold">{{ stats.endpoints }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">Endpoints</p>
            </div>
            <div class="rounded-lg border p-3 text-center">
                <p class="text-2xl font-bold">{{ stats.outOfScope }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">Out of Scope</p>
            </div>
            <div class="rounded-lg border p-3 text-center">
                <p class="text-2xl font-bold">{{ stats.ports }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">Open Ports</p>
            </div>
        </div>

        <div v-if="ports?.length" class="flex flex-wrap gap-1.5">
            <span class="text-xs text-muted-foreground mr-1 self-center">Open ports:</span>
            <Badge v-for="port in ports" :key="port" variant="outline" class="font-mono text-xs">
                :{{ port }}
            </Badge>
        </div>

        <div class="flex gap-1 border-b">
            <button
                v-for="tab in (['tree', 'list', 'oos'] as const)"
                :key="tab"
                class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
                :class="activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'"
                @click="activeTab = tab"
            >
                {{ tab === 'tree' ? 'Site Map' : tab === 'list' ? 'All Endpoints' : 'Out of Scope' }}
                <Badge v-if="tab === 'oos'" variant="secondary" class="ml-1.5 text-xs">{{ stats.outOfScope }}</Badge>
            </button>
        </div>

        <div v-if="activeTab === 'tree'" class="space-y-2">
            <div class="flex gap-2">
                <Button variant="ghost" size="sm" class="h-7 text-xs" @click="expandAll(treeNodes)">Expand all</Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs" @click="collapseAll">Collapse all</Button>
            </div>

            <div v-if="!treeNodes.length" class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <Globe class="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p class="text-sm">No site map data available.</p>
            </div>

            <div v-else class="rounded-lg border bg-muted/20 p-3 font-mono text-sm overflow-auto max-h-[400px]">
                <div class="flex items-center gap-1.5 py-0.5 text-muted-foreground">
                    <Globe class="h-4 w-4 shrink-0" />
                    <span>/</span>
                </div>

                <TreeNodeRow
                    v-for="node in treeNodes"
                    :key="node.path"
                    :node="node"
                    :expanded-paths="expandedPaths"
                    :depth="1"
                    @toggle="toggle"
                />
            </div>
        </div>

        <div v-if="activeTab === 'list'" class="space-y-2">
            <Input v-model="endpointSearch" placeholder="Filter endpoints…" class="h-8" />
            <div class="rounded-lg border overflow-auto max-h-[400px]">
                <div v-if="!filteredEndpoints.length" class="p-6 text-center text-sm text-muted-foreground">
                    No endpoints found.
                </div>
                <div
                    v-for="ep in filteredEndpoints"
                    :key="ep"
                    class="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-muted/30 text-xs font-mono group"
                >
                    <FileText class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span class="truncate flex-1" :title="ep">{{ ep }}</span>
                    <a
                        :href="ep"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:underline shrink-0"
                        @click.stop
                    >↗</a>
                </div>
            </div>
            <p class="text-xs text-muted-foreground text-right">
                Showing {{ filteredEndpoints.length }} of {{ stats.endpoints }} endpoints
            </p>
        </div>

        <div v-if="activeTab === 'oos'" class="space-y-2">
            <Input v-model="endpointSearch" placeholder="Filter…" class="h-8" />
            <div class="rounded-lg border overflow-auto max-h-[400px]">
                <div v-if="!filteredOos.length" class="p-6 text-center text-sm text-muted-foreground">
                    No out-of-scope URLs.
                </div>
                <div
                    v-for="ep in filteredOos"
                    :key="ep"
                    class="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 text-xs font-mono text-muted-foreground"
                >
                    <Link2Off class="h-3.5 w-3.5 shrink-0" />
                    <span class="truncate flex-1">{{ ep }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, h, PropType } from 'vue'
import { FolderOpen, Folder, FileText, ChevronDown, ChevronRight } from 'lucide-vue-next'

interface TreeNode {
    name: string
    path: string
    children: TreeNode[]
    isLeaf: boolean
}

const TreeNodeRow = defineComponent({
    name: 'TreeNodeRow',
    props: {
        node: { type: Object as PropType<TreeNode>, required: true },
        expandedPaths: { type: Object as PropType<Set<string>>, required: true },
        depth: { type: Number, default: 0 },
    },
    emits: ['toggle'],
    setup(props, { emit }) {
        return () => {
            const isOpen = props.expandedPaths.has(props.node.path)
            const indent = props.depth * 16

            const row = h('div', {
                class: 'flex items-center gap-1.5 py-0.5 cursor-pointer hover:text-foreground group',
                style: { paddingLeft: indent + 'px' },
                onClick: () => emit('toggle', props.node.path),
            }, [
                props.node.isLeaf
                    ? h(FileText, { class: 'h-3.5 w-3.5 shrink-0 text-muted-foreground' })
                    : h(isOpen ? ChevronDown : ChevronRight, { class: 'h-3.5 w-3.5 shrink-0 text-muted-foreground' }),
                props.node.isLeaf
                    ? null
                    : h(isOpen ? FolderOpen : Folder, { class: 'h-3.5 w-3.5 shrink-0 text-amber-500' }),
                h('span', { class: 'text-xs' }, props.node.name),
            ])

            const children = isOpen && props.node.children.length
                ? props.node.children.map(child =>
                    h(TreeNodeRow, {
                        key: child.path,
                        node: child,
                        expandedPaths: props.expandedPaths,
                        depth: props.depth + 1,
                        onToggle: (p: string) => emit('toggle', p),
                    }),
                )
                : []

            return h('div', {}, [row, ...children])
        }
    },
})

export { TreeNodeRow }
</script>
