import prisma from "../lib/prisma";

export default async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const data = JSON.parse(event.body!);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        date: new Date(data.date),
        vehicleNumber: data.vehicleNumber,

        buyerId: data.buyerId,

        // Snapshot fields (must match schema)
        buyerNameSnapshot: data.buyerName,
        buyerAddressSnapshot: data.buyerAddress,
        buyerGstinSnapshot: data.buyerGstin,

        sellerNameSnapshot: data.sellerName,
        sellerAddressSnapshot: data.sellerAddress,
        sellerGstinSnapshot: data.sellerGstin,
        sellerEmailSnapshot: data.sellerEmail,
        sellerPhoneSnapshot: data.sellerPhone,

        subtotal: data.subtotal,
        discount: data.discount,
        cgst: data.cgst,
        sgst: data.sgst,
        igst: data.igst,
        total: data.total,
        amountInWords: data.amountInWords,

        items: {
          create: data.items.map((item) => ({
            description: item.description,
            hsn: item.hsn,
            qty: item.qty,
            unit: item.unit,
            rate: item.rate,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: true, buyer: true },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(invoice),
    };
  } catch (err: any) {
    return { statusCode: 500, body: err.message };
  }
}
