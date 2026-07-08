import path from 'node:path'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COMPANY } from '@/lib/constants/company'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logo: { width: 120 },
  companyInfo: { textAlign: 'right', fontSize: 9, color: '#555555' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  meta: { fontSize: 9, color: '#555555', marginBottom: 24 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 8, textTransform: 'uppercase', color: '#888888', marginBottom: 2 },
  sectionValue: { fontSize: 11 },
  table: { borderTop: '1px solid #dddddd', borderBottom: '1px solid #dddddd' },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTop: '1px solid #eeeeee',
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBlock: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 24, marginBottom: 2 },
  totalLabel: { fontSize: 10, color: '#555555' },
  totalValue: { fontSize: 14, fontWeight: 700 },
  notes: { marginTop: 24, fontSize: 9, color: '#555555', whiteSpace: 'pre-wrap' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    borderTop: '1px solid #eeeeee',
    paddingTop: 8,
  },
})

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount)
}

export type QuoteDocumentProps = {
  leadName: string
  businessName: string | null
  contactInfo: string
  version: number
  currency: string
  notes: string | null
  createdAt: string
  items: { description: string; quantity: number; unit_price: number }[]
  amount: number
}

export function QuoteDocument({
  leadName,
  businessName,
  contactInfo,
  version,
  currency,
  notes,
  createdAt,
  items,
  amount,
}: QuoteDocumentProps) {
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' })
  const logoPath = path.join(process.cwd(), 'public', 'logo.png')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image (PDF primitive), not an HTML <img> */}
          <Image src={logoPath} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text>{COMPANY.name}</Text>
            <Text>{COMPANY.website}</Text>
            <Text>{COMPANY.email}</Text>
            <Text>{COMPANY.whatsapp}</Text>
          </View>
        </View>

        <Text style={styles.title}>Cotización v{version}</Text>
        <Text style={styles.meta}>{dateFormatter.format(new Date(createdAt))}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cliente</Text>
          <Text style={styles.sectionValue}>{businessName || leadName}</Text>
          <Text style={styles.sectionValue}>{contactInfo}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDescription}>Descripción</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colPrice}>Precio</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price, currency)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.quantity * item.unit_price, currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(amount, currency)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Notas</Text>
            <Text>{notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          {COMPANY.name} · {COMPANY.email} · {COMPANY.whatsapp}
        </Text>
      </Page>
    </Document>
  )
}
