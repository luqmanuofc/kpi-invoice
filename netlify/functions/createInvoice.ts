import prisma from "../lib/prisma";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        date: new Date(data.date),
        vehicleNumber: data.vehicleNumber,

        buyerId: data.buyerId,

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

    return new Response(JSON.stringify(invoice), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
