
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({ page: { padding: 30 }, title: { fontSize: 24, marginBottom: 20 } });

export const FinancialReportPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Báo cáo tài chính dự án</Text>
      <Text>Tổng chi phí: {data.total}</Text>
    </Page>
  </Document>
);
