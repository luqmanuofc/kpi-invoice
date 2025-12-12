export type ProductCategory =
  | "PVC_PIPE"
  | "PVC_BEND"
  | "PVC_CHANNEL"
  | "WIRE"
  | "ELECTRICAL_ACCESSORY";

export interface Product {
  id: string;
  name: string;
  hsn: string;
  defaultPrice: number;
  category: ProductCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  hsn: string;
  defaultPrice: number;
  category: ProductCategory;
}

export async function createProduct(data: ProductFormData) {
  const response = await fetch("/.netlify/functions/createProduct", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Create product failed: ${text}`);
  }

  return response.json();
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch("/.netlify/functions/getProducts", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get products failed: ${text}`);
  }

  return response.json();
}

export async function getProductById(id: string): Promise<Product> {
  const response = await fetch(`/.netlify/functions/getProduct?id=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Get product failed: ${text}`);
  }

  return response.json();
}

export async function updateProduct(id: string, data: ProductFormData) {
  const response = await fetch("/.netlify/functions/updateProduct", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update product failed: ${text}`);
  }

  return response.json();
}
