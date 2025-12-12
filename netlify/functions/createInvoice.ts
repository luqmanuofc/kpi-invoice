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

        buyerId: data.buyer.id,

        buyerNameSnapshot: data.buyer.name,
        buyerAddressSnapshot: data.buyer.address,
        buyerGstinSnapshot: data.buyer.gstin,
        buyerPhoneSnapshot: data.buyer.phone,

        sellerNameSnapshot: data.sellerName,
        sellerAddressSnapshot: data.sellerAddress,
        sellerGstinSnapshot: data.sellerGstin,
        sellerEmailSnapshot: data.sellerEmail,
        sellerPhoneSnapshot: data.sellerPhone,

        subtotal: data.subtotal,
        discount: data.discount,
        cgstRate: data.cgstRate,
        sgstRate: data.sgstRate,
        igstRate: data.igstRate,
        cgstAmount: data.cgstAmount,
        sgstAmount: data.sgstAmount,
        igstAmount: data.igstAmount,
        total: data.total,
        amountInWords: data.amountInWords,

        items: {
          create: data.items.map((item: any, index: number) => ({
            productId: item.productId,
            description: item.description,
            hsn: item.hsn,
            qty: item.qty,
            unit: item.unit,
            rate: item.rate,
            lineTotal: item.lineTotal,
            position: index,
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
