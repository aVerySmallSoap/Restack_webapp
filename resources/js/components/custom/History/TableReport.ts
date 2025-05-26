import { h } from 'vue';
import { ColumnDef } from '@tanstack/vue-table';
import HistoryAction from '@/components/custom/History/HistoryAction.vue';

export interface TableReport {
    id: string,
    date: string,
    scanner: string,
    type: string,
    target: string,
}

export const columns: ColumnDef<TableReport>[] = [
    {
        accessorKey: 'date',
        header: () => h('div', {class: ''}, 'Date'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium' }, ctx.getValue())
        },
    },
    {
        accessorKey: 'scanner',
        header: () => h('div', {class: '' }, 'Scanner'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium'}, ctx.getValue())
        }
    },
    {
        accessorKey: 'type',
        header: () => h('div', { class: '' }, 'Type'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium' }, ctx.getValue())
        }
    },
    {
        accessorKey: 'target',
        header: () => h('div', { class: ''}, 'Target'),
        cell: (ctx) => {
            return h('div', { class: 'font-medium'}, ctx.getValue())
        }
    },
    {
        accessorKey: 'actions',
        header: () => h('div', { class: '' }, 'Actions'),
        cell: ({row}) => {
            const TableReport = row.original
          return h(HistoryAction, { TableReport, class: 'flex flex-row gap-2' })
        },
    }
]
