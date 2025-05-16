<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script>
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const vulnerabilities = [
    { scanner: 'Wapiti', category: 'SQL Injection', severity: 'High' },
    { scanner: 'Wapiti', category: 'Cross-Site Scripting', severity: 'Medium' },
    { scanner: 'Wapiti', category: 'Command Injection', severity: 'High' },
    { scanner: 'ZAP', category: 'SQL Injection', severity: 'Critical' },
    { scanner: 'ZAP', category: 'Cross-Site Scripting', severity: 'High' },
    { scanner: 'ZAP', category: 'Open Redirect', severity: 'Medium' },
    { scanner: 'Arachni', category: 'SQL Injection', severity: 'High' },
    { scanner: 'Arachni', category: 'Cross-Site Scripting', severity: 'Low' },
    { scanner: 'Arachni', category: 'Local File Inclusion', severity: 'Medium' },
    { scanner: 'Wapiti', category: 'Cross-Site Scripting', severity: 'Low' },
    { scanner: 'ZAP', category: 'CSRF', severity: 'Medium' },
    { scanner: 'Arachni', category: 'Remote Code Execution', severity: 'Critical' },
    { scanner: 'Wapiti', category: 'Open Redirect', severity: 'Low' },
    { scanner: 'ZAP', category: 'Path Traversal', severity: 'High' },
    { scanner: 'Arachni', category: 'Unvalidated Input', severity: 'Low' },
    { scanner: 'Wapiti', category: 'Command Injection', severity: 'Medium' },
    { scanner: 'ZAP', category: 'HTTP Response Splitting', severity: 'Medium' },
    { scanner: 'Arachni', category: 'Directory Listing', severity: 'Low' },
    { scanner: 'Wapiti', category: 'SQL Injection', severity: 'Medium' },
    { scanner: 'ZAP', category: 'Clickjacking', severity: 'Low' },
];

export default {
  name: 'VulnerabilitySeverityDoughnutChart',
  components: { Doughnut },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Vulnerabilities by Severity',
            backgroundColor: [],
            data: [],
            borderWidth: 0
          }
        ]
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                const total = context.dataset.data.reduce((sum, current) => sum + current, 0);
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(2);
                return label + value + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    }
  },
  created() {
    this.processVulnerabilitySeverityData();
  },
  methods: {
    processVulnerabilitySeverityData() {
      const severityCounts = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0,
      };

      const severityLevels = [
        { label: 'Critical', color: '#DC143C' }, // Crimson Red
        { label: 'High', color: '#FF4500' },    // Orange Red
        { label: 'Medium', color: '#FFD700' },   // Gold
        { label: 'Low', color: '#ADD8E6' }      // Light Blue
      ];

      vulnerabilities.forEach(vulnerability => {
        const severity = vulnerability.severity;
        if (severityCounts.hasOwnProperty(severity)) {
          severityCounts[severity]++;
        }
      });

      this.chartData.labels = severityLevels.map(s => s.label);
      this.chartData.datasets[0].data = severityLevels.map(s => severityCounts[s.label]);
      this.chartData.datasets[0].backgroundColor = severityLevels.map(s => s.color);
    }
  }
}
</script>
