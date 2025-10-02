interface AmazonCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
  mode: 'sandbox' | 'production'
  region: string
  marketplaceId: string
}

interface AmazonProduct {
  sku: string
  asin?: string
  title: string
  brand: string
  price: number
  quantity: number
  image?: string
  status: 'active' | 'inactive'
}

class AmazonSPAPI {
  private credentials: AmazonCredentials | null = null
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  async loadCredentials(): Promise<boolean> {
    try {
      const response = await fetch('/.credentials')
      if (!response.ok) {
        console.warn('No credentials file found. Using mock data.')
        return false
      }
      this.credentials = await response.json()
      return true
    } catch (error) {
      console.warn('Failed to load credentials:', error)
      return false
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.credentials) {
      await this.loadCredentials()
    }

    if (!this.credentials) {
      return null
    }

    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Refresh the token
    try {
      const endpoint = this.credentials.mode === 'sandbox'
        ? 'https://api.amazon.com/auth/o2/token'
        : 'https://api.amazon.com/auth/o2/token'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret
        })
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 min early

      return this.accessToken
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return null
    }
  }

  async fetchProducts(): Promise<AmazonProduct[]> {
    const token = await this.getAccessToken()

    if (!token || !this.credentials) {
      console.log('No credentials - returning mock data')
      return this.getMockProducts()
    }

    try {
      const baseUrl = this.credentials.mode === 'sandbox'
        ? 'https://sandbox.sellingpartnerapi-na.amazon.com'
        : 'https://sellingpartnerapi-na.amazon.com'

      const response = await fetch(
        `${baseUrl}/listings/2021-08-01/items/${this.credentials.marketplaceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-amz-access-token': token
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      // Transform Amazon response to our format
      return this.transformAmazonProducts(data)
    } catch (error) {
      console.error('Failed to fetch products from Amazon:', error)
      console.log('Falling back to mock data')
      return this.getMockProducts()
    }
  }

  private transformAmazonProducts(amazonData: any): AmazonProduct[] {
    // Transform Amazon's response format to our app's format
    if (!amazonData.items) return []

    return amazonData.items.map((item: any) => ({
      sku: item.sku,
      asin: item.asin,
      title: item.attributes?.item_name?.[0]?.value || 'Unknown Product',
      brand: item.attributes?.brand?.[0]?.value || 'Unknown Brand',
      price: parseFloat(item.attributes?.list_price?.[0]?.Amount || '0'),
      quantity: parseInt(item.attributes?.quantity || '0'),
      image: item.attributes?.main_product_image_locator?.[0]?.value,
      status: item.status === 'ACTIVE' ? 'active' : 'inactive'
    }))
  }

  private getMockProducts(): AmazonProduct[] {
    return [
      {
        sku: 'HAY-5LB-001',
        asin: 'B07XYZ1234',
        title: 'Happy Haystack Premium Timothy Hay 5lb',
        brand: 'Happy Haystack',
        price: 24.99,
        quantity: 145,
        image: '/hay-product.webp',
        status: 'active'
      },
      {
        sku: 'HAY-10LB-001',
        asin: 'B07XYZ5678',
        title: 'Happy Haystack Premium Timothy Hay 10lb',
        brand: 'Happy Haystack',
        price: 44.99,
        quantity: 78,
        image: '/hay-product.webp',
        status: 'active'
      }
    ]
  }

  async syncProducts(): Promise<{ success: boolean; count: number; products: AmazonProduct[] }> {
    try {
      const products = await this.fetchProducts()
      return {
        success: true,
        count: products.length,
        products
      }
    } catch (error) {
      console.error('Product sync failed:', error)
      return {
        success: false,
        count: 0,
        products: []
      }
    }
  }
}

export const amazonApi = new AmazonSPAPI()
export type { AmazonProduct, AmazonCredentials }
