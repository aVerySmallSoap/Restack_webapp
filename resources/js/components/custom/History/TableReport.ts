import HistoryAction from '@/components/custom/History/HistoryAction.vue';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import { h } from 'vue';

export interface TableReport {
    id: string;
    date: string;
    scanner: string;
    type: string;
    target: string;
}

export const columns: ColumnDef<TableReport>[] = [
    // {
    //     accessorKey: 'date',
    //     header: ({ column }) =>  {h('div', {class: ''}, 'Date'),}
    //     cell: (ctx) => {
    //         return h('div', { class: 'font-medium' }, ctx.getValue())
    //     },
    // },
    {
        accessorKey: 'date',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                },
                () => ['Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
            );
        },
        cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('date')),
    },
    {
        accessorKey: 'scanner',
        header: () => h('div', { class: '' }, 'Scanner'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium' }, ctx.getValue());
        },
    },
    {
        accessorKey: 'type',
        header: () => h('div', { class: '' }, 'Type'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium' }, ctx.getValue());
        },
    },
    {
        accessorKey: 'target',
        header: () => h('div', { class: '' }, 'Target'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium' }, ctx.getValue());
        },
    },
    {
        accessorKey: 'actions',
        header: () => h('div', { class: '' }, 'Actions'),
        cell: ({ row }) => {
            const TableReport = row.original;
            return h(HistoryAction, { TableReport, class: 'flex flex-row gap-2' });
        },
    },
];
