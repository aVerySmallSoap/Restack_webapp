import { h } from 'vue';
import { ColumnDef } from '@tanstack/vue-table';

export interface TableReport {
    id: string,
    date: string,
    scanner: string,
    type: string,
    target: string,
}

export const columns: ColumnDef<TableReport>[] = [
    {
        accessorKey: 'id',
        header: () => h('div', { class: 'text-right' }, 'ID'),
        cell: () => {
            return h('div', { class: 'text-right font-medium' })
        },
    }
]
