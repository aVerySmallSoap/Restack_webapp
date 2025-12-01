<script lang="ts">
const props = defineProps<{ scans: any[] }>()
function statusClass(status: string) {
    switch (status) {
        case 'Completed': return 'text-green-700 font-semibold'
        case 'Failed': return 'text-red-700 font-semibold'
        case 'In Progress': return 'text-blue-700 font-semibold'
        default: return ''
    }
}
</script>

<template>
    <table class="scan-table w-full border-collapse rounded-lg shadow bg-white dark:bg-neutral-900" aria-label="Recent scans table">
        <thead>
        <tr>
            <th scope="col" class="px-4 py-2 text-left">Application</th>
            <th scope="col" class="px-4 py-2 text-left">Status</th>
            <th scope="col" class="px-4 py-2 text-left">Vulnerabilities</th>
            <th scope="col" class="px-4 py-2 text-left">Started At</th>
            <th scope="col" class="px-4 py-2 text-left">Finished At</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="scan in scans" :key="scan.id" :class="{ 'bg-neutral-100 dark:bg-neutral-800': scan.status === 'Failed' }">
            <td class="px-4 py-2 font-medium">{{ scan.app }}</td>
            <td class="px-4 py-2">
          <span
              :class="statusClass(scan.status)"
              :aria-label="scan.status"
              role="status"
          >{{ scan.status }}</span>
            </td>
            <td class="px-4 py-2">{{ scan.vulnerabilities }}</td>
            <td class="px-4 py-2">{{ scan.startedAt }}</td>
            <td class="px-4 py-2">
                <span v-if="scan.finishedAt">{{ scan.finishedAt }}</span>
                <span v-else class="italic text-neutral-400">In progress</span>
            </td>
        </tr>
        </tbody>
    </table>
</template>

<style scoped>

</style>
