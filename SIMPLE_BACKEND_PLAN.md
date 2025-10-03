# Simple Amazon Seller Backend - 1 Week Build Plan
## "Bypass the Horrible Amazon UI"

**Goal:** Build a clean interface to manage Amazon inventory and orders WITHOUT touching Seller Central

**Timeline:** 1 week with AI assistance (Claude/Cursor)

**Tech Stack:**
- Django 5.0 + Django REST Framework
- SQLite (upgrade to PostgreSQL later if needed)
- Celery + Redis (for background syncs)
- Existing Vue 3 frontend
- Amazon SP-API

---

## What We're Building

### 3 Core Features (That's It!)

1. **Inventory Dashboard**
   - See all your Amazon products in a clean table
   - View FBA and FBM stock levels
   - Update FBM quantities with one click
   - Auto-sync to Amazon

2. **Order Fulfillment**
   - List of FBM orders that need shipping
   - Simple form: tracking number + carrier
   - Click "Ship" → updates Amazon automatically
   - No more navigating Seller Central's maze

3. **Auto-Sync**
   - Background job pulls orders every 15 minutes
   - Updates inventory from Amazon hourly
   - Set it and forget it

**What we're NOT building (yet):**
- ❌ Warehouse management
- ❌ Analytics/reports
- ❌ Supplier management
- ❌ FBA shipment planning
- ❌ Complex business intelligence

Add those later if Joseph asks for them.

---

## Day-by-Day Build Plan

### Day 1: Django Project Setup

**Step 1: Create Project Structure**

```bash
# Create project
mkdir amazon-backend
cd amazon-backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install Django==5.0 \
    djangorestframework==3.14 \
    django-cors-headers==4.3 \
    celery==5.3 \
    redis==5.0 \
    python-sp-api==0.19 \
    python-dotenv==1.0

# Create Django project
django-admin startproject config .
python manage.py startapp products
python manage.py startapp orders
python manage.py startapp amazon_sync

# Save dependencies
pip freeze > requirements.txt
```

**Step 2: Configure Settings**

Ask Claude: *"Generate Django settings for a simple Amazon seller backend with SQLite, Django REST Framework, CORS headers for a Vue frontend at localhost:5173, and Celery with Redis"*

```python
# config/settings.py
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'corsheaders',

    # Local apps
    'products',
    'orders',
    'amazon_sync',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database - SQLite for now
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS - Allow Vue frontend
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}

# Celery
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_TIMEZONE = 'America/New_York'  # Change to Joseph's timezone

# Amazon SP-API Credentials
AMAZON_REFRESH_TOKEN = os.getenv('AMAZON_REFRESH_TOKEN')
AMAZON_CLIENT_ID = os.getenv('AMAZON_CLIENT_ID')
AMAZON_CLIENT_SECRET = os.getenv('AMAZON_CLIENT_SECRET')
AMAZON_AWS_ACCESS_KEY = os.getenv('AMAZON_AWS_ACCESS_KEY')
AMAZON_AWS_SECRET_KEY = os.getenv('AMAZON_AWS_SECRET_KEY')
AMAZON_ROLE_ARN = os.getenv('AMAZON_ROLE_ARN')
AMAZON_MARKETPLACE_ID = 'ATVPDKIKX0DER'  # USA
```

**Step 3: Create .env File**

```bash
# .env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Amazon SP-API Credentials
AMAZON_REFRESH_TOKEN=Atzr|your-refresh-token
AMAZON_CLIENT_ID=amzn1.application-oa2-client.your-client-id
AMAZON_CLIENT_SECRET=your-client-secret
AMAZON_AWS_ACCESS_KEY=AKIA...
AMAZON_AWS_SECRET_KEY=...
AMAZON_ROLE_ARN=arn:aws:iam::123456789012:role/SellerPartnerAPI
```

**Step 4: Create Models**

Ask Claude: *"Generate Django models for Amazon products with SKU, ASIN, title, price, FBA quantity, and FBM quantity"*

```python
# products/models.py
from django.db import models

class Product(models.Model):
    """Amazon product listing"""
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    asin = models.CharField(max_length=10, blank=True, db_index=True)
    title = models.CharField(max_length=500)

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # Inventory
    fba_quantity = models.IntegerField(default=0, help_text="Amazon FBA stock")
    fbm_quantity = models.IntegerField(default=0, help_text="Seller-fulfilled stock")

    # Status
    is_active = models.BooleanField(default=True)

    # Sync tracking
    last_synced_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sku']

    def __str__(self):
        return f"{self.sku} - {self.title}"

    @property
    def total_quantity(self):
        """Total units across FBA and FBM"""
        return self.fba_quantity + self.fbm_quantity


# orders/models.py
class Order(models.Model):
    """Amazon orders"""
    ORDER_STATUSES = [
        ('PENDING', 'Pending'),
        ('UNSHIPPED', 'Unshipped'),
        ('SHIPPED', 'Shipped'),
        ('CANCELLED', 'Cancelled'),
    ]

    amazon_order_id = models.CharField(max_length=50, unique=True, db_index=True)

    # Customer
    customer_name = models.CharField(max_length=200, blank=True)

    # Shipping address
    ship_address = models.TextField()
    ship_city = models.CharField(max_length=100)
    ship_state = models.CharField(max_length=50)
    ship_zip = models.CharField(max_length=20)

    # Order details
    status = models.CharField(max_length=20, choices=ORDER_STATUSES)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    order_date = models.DateTimeField(db_index=True)

    # FBM only
    is_fbm = models.BooleanField(default=False)
    tracking_number = models.CharField(max_length=100, blank=True)
    carrier = models.CharField(max_length=50, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.amazon_order_id} - {self.customer_name}"


class OrderItem(models.Model):
    """Items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, null=True, blank=True)

    sku = models.CharField(max_length=50)
    title = models.CharField(max_length=500)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.sku} x{self.quantity}"
```

**Step 5: Run Migrations**

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

---

### Day 2: Amazon SP-API Integration

**Step 1: Create Amazon API Service**

Ask Claude: *"Create a Python class using sp-api library to fetch Amazon products, orders, and update FBM inventory quantities"*

```python
# amazon_sync/services.py
from sp_api.api import Orders, CatalogItems, FbaInventory, ListingsItems
from sp_api.base import Marketplaces, SellingApiException
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class AmazonAPIClient:
    """Simple wrapper for Amazon SP-API"""

    def __init__(self):
        self.credentials = {
            'refresh_token': settings.AMAZON_REFRESH_TOKEN,
            'lwa_app_id': settings.AMAZON_CLIENT_ID,
            'lwa_client_secret': settings.AMAZON_CLIENT_SECRET,
            'aws_access_key': settings.AMAZON_AWS_ACCESS_KEY,
            'aws_secret_key': settings.AMAZON_AWS_SECRET_KEY,
            'role_arn': settings.AMAZON_ROLE_ARN,
        }
        self.marketplace = Marketplaces.US

    def get_orders(self, created_after=None):
        """
        Fetch recent orders from Amazon

        Returns list of order dictionaries
        """
        try:
            orders_api = Orders(credentials=self.credentials, marketplace=self.marketplace)

            # Default to last 30 days if not specified
            if created_after is None:
                created_after = timezone.now() - timezone.timedelta(days=30)

            response = orders_api.get_orders(
                MarketplaceIds=[settings.AMAZON_MARKETPLACE_ID],
                CreatedAfter=created_after.isoformat(),
            )

            orders = response.payload.get('Orders', [])
            logger.info(f"Fetched {len(orders)} orders from Amazon")
            return orders

        except SellingApiException as e:
            logger.error(f"Failed to fetch orders: {e}")
            raise

    def get_order_items(self, amazon_order_id):
        """Get line items for a specific order"""
        try:
            orders_api = Orders(credentials=self.credentials, marketplace=self.marketplace)
            response = orders_api.get_order_items(amazon_order_id)

            items = response.payload.get('OrderItems', [])
            return items

        except SellingApiException as e:
            logger.error(f"Failed to fetch order items: {e}")
            raise

    def get_fba_inventory(self):
        """Fetch FBA inventory levels"""
        try:
            fba_api = FbaInventory(credentials=self.credentials, marketplace=self.marketplace)
            response = fba_api.get_inventory_summaries(
                marketplaceIds=[settings.AMAZON_MARKETPLACE_ID]
            )

            inventory = response.payload.get('inventorySummaries', [])
            logger.info(f"Fetched FBA inventory for {len(inventory)} SKUs")
            return inventory

        except SellingApiException as e:
            logger.error(f"Failed to fetch FBA inventory: {e}")
            raise

    def update_fbm_quantity(self, sku, quantity):
        """
        Update FBM inventory quantity for a product

        Args:
            sku: Product SKU
            quantity: New quantity to set
        """
        try:
            listings_api = ListingsItems(credentials=self.credentials, marketplace=self.marketplace)

            # Construct the patch to update quantity
            patches = [{
                'op': 'replace',
                'path': '/attributes/fulfillment_availability',
                'value': [{
                    'fulfillment_channel_code': 'DEFAULT',
                    'quantity': quantity
                }]
            }]

            # Get seller ID from settings (you'll need to add this)
            seller_id = settings.AMAZON_SELLER_ID

            response = listings_api.patch_listings_item(
                sellerId=seller_id,
                sku=sku,
                marketplaceIds=[settings.AMAZON_MARKETPLACE_ID],
                body={'patches': patches}
            )

            logger.info(f"Updated FBM quantity for {sku} to {quantity}")
            return True

        except SellingApiException as e:
            logger.error(f"Failed to update quantity for {sku}: {e}")
            raise

    def confirm_shipment(self, amazon_order_id, tracking_number, carrier_code):
        """
        Mark an FBM order as shipped

        Args:
            amazon_order_id: Amazon order ID
            tracking_number: Tracking number from carrier
            carrier_code: Carrier code (USPS, UPS, FEDEX)
        """
        try:
            orders_api = Orders(credentials=self.credentials, marketplace=self.marketplace)

            # Map friendly names to Amazon carrier codes
            carrier_mapping = {
                'USPS': 'USPS',
                'UPS': 'UPS',
                'FEDEX': 'FedEx',
            }

            response = orders_api.update_shipment_status(
                orderId=amazon_order_id,
                body={
                    'trackingNumber': tracking_number,
                    'carrierCode': carrier_mapping.get(carrier_code, carrier_code)
                }
            )

            logger.info(f"Confirmed shipment for order {amazon_order_id}")
            return True

        except SellingApiException as e:
            logger.error(f"Failed to confirm shipment: {e}")
            raise


# Initialize singleton instance
amazon_client = AmazonAPIClient()
```

**Step 2: Create Sync Logic**

Ask Claude: *"Create Django service to sync Amazon orders and inventory to local database"*

```python
# amazon_sync/sync_service.py
from products.models import Product
from orders.models import Order, OrderItem
from .services import amazon_client
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


class SyncService:
    """Synchronize data between Amazon and local database"""

    @transaction.atomic
    def sync_orders(self, days_back=7):
        """
        Pull recent orders from Amazon and save to database

        Args:
            days_back: How many days of orders to fetch

        Returns:
            dict with counts of created/updated orders
        """
        logger.info(f"Starting order sync for last {days_back} days")

        created_after = timezone.now() - timezone.timedelta(days=days_back)

        try:
            # Fetch orders from Amazon
            amazon_orders = amazon_client.get_orders(created_after=created_after)

            created_count = 0
            updated_count = 0

            for amazon_order in amazon_orders:
                order, created = self._process_order(amazon_order)

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            logger.info(f"Order sync complete: {created_count} created, {updated_count} updated")

            return {
                'success': True,
                'created': created_count,
                'updated': updated_count,
                'total': len(amazon_orders)
            }

        except Exception as e:
            logger.error(f"Order sync failed: {e}")
            return {'success': False, 'error': str(e)}

    def _process_order(self, amazon_order):
        """Process a single order from Amazon API"""
        amazon_order_id = amazon_order['AmazonOrderId']

        # Determine if FBM (merchant-fulfilled)
        is_fbm = amazon_order.get('FulfillmentChannel') == 'MFN'

        # Parse shipping address
        ship_addr = amazon_order.get('ShippingAddress', {})

        # Map Amazon status to our status
        status_map = {
            'Pending': 'PENDING',
            'Unshipped': 'UNSHIPPED',
            'PartiallyShipped': 'UNSHIPPED',
            'Shipped': 'SHIPPED',
            'Canceled': 'CANCELLED',
        }
        status = status_map.get(amazon_order.get('OrderStatus'), 'PENDING')

        # Create or update order
        order, created = Order.objects.update_or_create(
            amazon_order_id=amazon_order_id,
            defaults={
                'customer_name': ship_addr.get('Name', ''),
                'ship_address': ship_addr.get('AddressLine1', ''),
                'ship_city': ship_addr.get('City', ''),
                'ship_state': ship_addr.get('StateOrRegion', ''),
                'ship_zip': ship_addr.get('PostalCode', ''),
                'status': status,
                'total_amount': amazon_order.get('OrderTotal', {}).get('Amount', 0),
                'order_date': amazon_order['PurchaseDate'],
                'is_fbm': is_fbm,
            }
        )

        # Fetch and save order items
        if created:
            amazon_items = amazon_client.get_order_items(amazon_order_id)

            for item in amazon_items:
                sku = item['SellerSKU']

                # Try to link to product
                try:
                    product = Product.objects.get(sku=sku)
                except Product.DoesNotExist:
                    product = None
                    logger.warning(f"Product {sku} not found in database")

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    sku=sku,
                    title=item['Title'],
                    quantity=item['QuantityOrdered'],
                    price=item['ItemPrice']['Amount']
                )

        return order, created

    def sync_fba_inventory(self):
        """Update FBA inventory quantities from Amazon"""
        logger.info("Starting FBA inventory sync")

        try:
            fba_inventory = amazon_client.get_fba_inventory()

            updated_count = 0

            for item in fba_inventory:
                sku = item['sellerSku']
                quantity = item.get('totalQuantity', 0)

                # Update or create product
                product, created = Product.objects.update_or_create(
                    sku=sku,
                    defaults={
                        'fba_quantity': quantity,
                        'last_synced_at': timezone.now(),
                    }
                )

                updated_count += 1

            logger.info(f"FBA inventory sync complete: {updated_count} products updated")

            return {'success': True, 'updated': updated_count}

        except Exception as e:
            logger.error(f"FBA inventory sync failed: {e}")
            return {'success': False, 'error': str(e)}


# Singleton instance
sync_service = SyncService()
```

---

### Day 3: Celery Background Tasks

**Step 1: Configure Celery**

```python
# config/celery.py
from celery import Celery
from celery.schedules import crontab
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('amazon_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Schedule periodic tasks
app.conf.beat_schedule = {
    'sync-orders-every-15-minutes': {
        'task': 'amazon_sync.tasks.sync_orders_task',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'sync-fba-inventory-hourly': {
        'task': 'amazon_sync.tasks.sync_fba_inventory_task',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

```python
# config/__init__.py
from .celery import app as celery_app

__all__ = ('celery_app',)
```

**Step 2: Create Celery Tasks**

```python
# amazon_sync/tasks.py
from celery import shared_task
from .sync_service import sync_service
import logging

logger = logging.getLogger(__name__)


@shared_task
def sync_orders_task():
    """Background task to sync orders from Amazon"""
    logger.info("Running scheduled order sync")
    result = sync_service.sync_orders(days_back=7)
    return result


@shared_task
def sync_fba_inventory_task():
    """Background task to sync FBA inventory"""
    logger.info("Running scheduled FBA inventory sync")
    result = sync_service.sync_fba_inventory()
    return result
```

**Step 3: Start Redis & Celery (for development)**

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery Worker
celery -A config worker -l info

# Terminal 3: Start Celery Beat (scheduler)
celery -A config beat -l info

# Terminal 4: Django dev server
python manage.py runserver
```

---

### Day 4: REST API Endpoints

Ask Claude: *"Generate Django REST Framework serializers and viewsets for Product and Order models with custom actions for syncing and shipping"*

```python
# products/serializers.py
from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    total_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'asin', 'title', 'price',
            'fba_quantity', 'fbm_quantity', 'total_quantity',
            'is_active', 'last_synced_at', 'updated_at'
        ]


# orders/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'sku', 'title', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'amazon_order_id', 'customer_name',
            'ship_address', 'ship_city', 'ship_state', 'ship_zip',
            'status', 'total_amount', 'order_date',
            'is_fbm', 'tracking_number', 'carrier', 'shipped_at',
            'items'
        ]
```

```python
# products/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer
from amazon_sync.services import amazon_client
from django.utils import timezone


class ProductViewSet(viewsets.ModelViewSet):
    """API endpoints for products"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    filterset_fields = ['sku', 'asin']
    search_fields = ['title', 'sku']
    ordering_fields = ['sku', 'updated_at']

    @action(detail=True, methods=['post'])
    def update_quantity(self, request, pk=None):
        """
        Update FBM quantity for a product

        POST /api/products/{id}/update_quantity/
        {
            "quantity": 100
        }
        """
        product = self.get_object()
        new_quantity = int(request.data.get('quantity', 0))

        try:
            # Update on Amazon
            amazon_client.update_fbm_quantity(product.sku, new_quantity)

            # Update locally
            product.fbm_quantity = new_quantity
            product.last_synced_at = timezone.now()
            product.save()

            return Response({
                'success': True,
                'sku': product.sku,
                'new_quantity': new_quantity
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# orders/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer
from amazon_sync.services import amazon_client
from django.utils import timezone


class OrderViewSet(viewsets.ModelViewSet):
    """API endpoints for orders"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    filterset_fields = ['status', 'is_fbm']
    search_fields = ['amazon_order_id', 'customer_name']
    ordering_fields = ['order_date']

    @action(detail=False, methods=['get'])
    def pending_shipment(self, request):
        """
        Get FBM orders that need to be shipped

        GET /api/orders/pending_shipment/
        """
        pending = self.queryset.filter(
            is_fbm=True,
            status='UNSHIPPED'
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """
        Mark order as shipped

        POST /api/orders/{id}/ship/
        {
            "tracking_number": "9400123456789",
            "carrier": "USPS"
        }
        """
        order = self.get_object()

        tracking_number = request.data.get('tracking_number')
        carrier = request.data.get('carrier', 'USPS')

        if not tracking_number:
            return Response({
                'success': False,
                'error': 'Tracking number is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Update Amazon
            amazon_client.confirm_shipment(
                amazon_order_id=order.amazon_order_id,
                tracking_number=tracking_number,
                carrier_code=carrier
            )

            # Update locally
            order.tracking_number = tracking_number
            order.carrier = carrier
            order.status = 'SHIPPED'
            order.shipped_at = timezone.now()
            order.save()

            return Response({
                'success': True,
                'order_id': order.amazon_order_id,
                'tracking_number': tracking_number
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# amazon_sync/views.py
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .sync_service import sync_service
from .tasks import sync_orders_task, sync_fba_inventory_task


class SyncViewSet(ViewSet):
    """Manual sync triggers"""

    @action(detail=False, methods=['post'])
    def sync_orders(self, request):
        """
        Manually trigger order sync

        POST /api/sync/sync_orders/
        """
        task = sync_orders_task.delay()
        return Response({
            'success': True,
            'task_id': task.id,
            'message': 'Order sync started'
        })

    @action(detail=False, methods=['post'])
    def sync_inventory(self, request):
        """
        Manually trigger FBA inventory sync

        POST /api/sync/sync_inventory/
        """
        task = sync_fba_inventory_task.delay()
        return Response({
            'success': True,
            'task_id': task.id,
            'message': 'Inventory sync started'
        })
```

**Step 4: Wire Up URLs**

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products.views import ProductViewSet
from orders.views import OrderViewSet
from amazon_sync.views import SyncViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename='products')
router.register('orders', OrderViewSet, basename='orders')
router.register('sync', SyncViewSet, basename='sync')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
```

---

### Day 5-6: Frontend Integration

**Step 1: Update Vue App to Use Django API**

```typescript
// src/services/backendApi.ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Products
export const productsApi = {
  async getAll() {
    const response = await api.get('/products/')
    return response.data
  },

  async updateQuantity(productId: number, quantity: number) {
    const response = await api.post(`/products/${productId}/update_quantity/`, {
      quantity
    })
    return response.data
  }
}

// Orders
export const ordersApi = {
  async getPendingShipments() {
    const response = await api.get('/orders/pending_shipment/')
    return response.data
  },

  async shipOrder(orderId: number, trackingNumber: string, carrier: string) {
    const response = await api.post(`/orders/${orderId}/ship/`, {
      tracking_number: trackingNumber,
      carrier
    })
    return response.data
  }
}

// Sync
export const syncApi = {
  async syncOrders() {
    const response = await api.post('/sync/sync_orders/')
    return response.data
  },

  async syncInventory() {
    const response = await api.post('/sync/sync_inventory/')
    return response.data
  }
}
```

**Step 2: Create Inventory View**

```vue
<!-- src/views/InventoryView.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Amazon Inventory
            <v-spacer />
            <v-btn color="primary" @click="syncInventory" :loading="syncing">
              <v-icon left>mdi-sync</v-icon>
              Sync from Amazon
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="products"
              :loading="loading"
              :search="search"
            >
              <template v-slot:top>
                <v-text-field
                  v-model="search"
                  label="Search products"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  class="mb-4"
                />
              </template>

              <template v-slot:item.fbm_quantity="{ item }">
                <v-edit-dialog
                  :return-value.sync="item.fbm_quantity"
                  @save="updateQuantity(item)"
                >
                  <span class="cursor-pointer text-primary">
                    {{ item.fbm_quantity }}
                  </span>
                  <template v-slot:input>
                    <v-text-field
                      v-model.number="item.fbm_quantity"
                      label="FBM Quantity"
                      type="number"
                      single-line
                    />
                  </template>
                </v-edit-dialog>
              </template>

              <template v-slot:item.price="{ item }">
                ${{ item.price }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productsApi, syncApi } from '@/services/backendApi'

const products = ref([])
const loading = ref(false)
const syncing = ref(false)
const search = ref('')

const headers = [
  { title: 'SKU', key: 'sku' },
  { title: 'Product', key: 'title' },
  { title: 'Price', key: 'price' },
  { title: 'FBA Stock', key: 'fba_quantity' },
  { title: 'FBM Stock (editable)', key: 'fbm_quantity' },
  { title: 'Total', key: 'total_quantity' },
  { title: 'Last Synced', key: 'last_synced_at' },
]

async function loadProducts() {
  loading.value = true
  try {
    products.value = await productsApi.getAll()
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

async function updateQuantity(product: any) {
  try {
    await productsApi.updateQuantity(product.id, product.fbm_quantity)
    // Refresh to get updated data
    await loadProducts()
  } catch (error) {
    console.error('Failed to update quantity:', error)
  }
}

async function syncInventory() {
  syncing.value = true
  try {
    await syncApi.syncInventory()
    // Wait a few seconds then refresh
    setTimeout(loadProducts, 3000)
  } catch (error) {
    console.error('Failed to sync inventory:', error)
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>
```

**Step 3: Create Orders View**

```vue
<!-- src/views/OrdersView.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Orders to Ship
            <v-spacer />
            <v-btn color="primary" @click="refreshOrders" :loading="loading">
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-alert v-if="pendingOrders.length === 0" type="success">
              No orders pending shipment!
            </v-alert>

            <v-data-table
              v-else
              :headers="headers"
              :items="pendingOrders"
              :loading="loading"
            >
              <template v-slot:item.order_date="{ item }">
                {{ formatDate(item.order_date) }}
              </template>

              <template v-slot:item.total_amount="{ item }">
                ${{ item.total_amount }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn color="primary" @click="openShipDialog(item)" size="small">
                  Ship Order
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ship dialog -->
    <v-dialog v-model="shipDialog" max-width="600">
      <v-card>
        <v-card-title>Ship Order {{ selectedOrder?.amazon_order_id }}</v-card-title>

        <v-card-text>
          <p class="mb-4">
            <strong>Customer:</strong> {{ selectedOrder?.customer_name }}<br>
            <strong>Address:</strong> {{ selectedOrder?.ship_address }},
            {{ selectedOrder?.ship_city }}, {{ selectedOrder?.ship_state }} {{ selectedOrder?.ship_zip }}
          </p>

          <v-divider class="my-4" />

          <h3 class="mb-2">Items:</h3>
          <ul class="mb-4">
            <li v-for="item in selectedOrder?.items" :key="item.id">
              {{ item.title }} - Qty: {{ item.quantity }}
            </li>
          </ul>

          <v-divider class="my-4" />

          <v-text-field
            v-model="shipment.tracking_number"
            label="Tracking Number"
            required
          />

          <v-select
            v-model="shipment.carrier"
            :items="carriers"
            label="Carrier"
            required
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="shipDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="submitShipment" :loading="shipping">
            Confirm Shipment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ordersApi } from '@/services/backendApi'
import { format } from 'date-fns'

const pendingOrders = ref([])
const loading = ref(false)
const shipDialog = ref(false)
const shipping = ref(false)
const selectedOrder = ref(null)

const shipment = ref({
  tracking_number: '',
  carrier: 'USPS'
})

const headers = [
  { title: 'Order ID', key: 'amazon_order_id' },
  { title: 'Customer', key: 'customer_name' },
  { title: 'City', key: 'ship_city' },
  { title: 'State', key: 'ship_state' },
  { title: 'Order Date', key: 'order_date' },
  { title: 'Total', key: 'total_amount' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const carriers = ['USPS', 'UPS', 'FEDEX']

async function refreshOrders() {
  loading.value = true
  try {
    pendingOrders.value = await ordersApi.getPendingShipments()
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
}

function openShipDialog(order: any) {
  selectedOrder.value = order
  shipment.value = {
    tracking_number: '',
    carrier: 'USPS'
  }
  shipDialog.value = true
}

async function submitShipment() {
  shipping.value = true
  try {
    await ordersApi.shipOrder(
      selectedOrder.value.id,
      shipment.value.tracking_number,
      shipment.value.carrier
    )

    shipDialog.value = false
    await refreshOrders()
  } catch (error) {
    console.error('Failed to ship order:', error)
  } finally {
    shipping.value = false
  }
}

onMounted(() => {
  refreshOrders()
})
</script>
```

**Step 4: Add Routes**

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ... existing routes ...
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue')
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue')
    },
  ]
})

export default router
```

**Step 5: Update Navigation**

```vue
<!-- src/App.vue - Add to navigation drawer -->
<v-list-item to="/inventory">
  <template v-slot:prepend>
    <v-icon>mdi-package-variant</v-icon>
  </template>
  <v-list-item-title>Inventory</v-list-item-title>
</v-list-item>

<v-list-item to="/orders">
  <template v-slot:prepend>
    <v-icon>mdi-truck-delivery</v-icon>
  </template>
  <v-list-item-title>Orders to Ship</v-list-item-title>
</v-list-item>
```

---

### Day 7: Testing & Deployment

**Step 1: Test Locally**

```bash
# Start everything
redis-server &
celery -A config worker -l info &
celery -A config beat -l info &
python manage.py runserver &
cd .. && npm run dev  # Vue frontend
```

**Step 2: Test the Flow**

1. Go to `http://localhost:5173/inventory`
2. Click "Sync from Amazon"
3. Edit FBM quantity, press Enter
4. Check Amazon Seller Central - quantity should update
5. Go to `/orders`
6. Enter tracking number, click "Ship Order"
7. Check Amazon - order should be marked shipped

**Step 3: Deploy to Railway.app**

```bash
# Create railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn config.wsgi:application",
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF

# Create Procfile for worker
cat > Procfile << EOF
web: gunicorn config.wsgi:application
worker: celery -A config worker -l info
beat: celery -A config beat -l info
EOF

# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/joseph/amazon-backend.git
git push -u origin main

# Deploy on Railway
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub
# 3. Select repo
# 4. Add PostgreSQL service
# 5. Add Redis service
# 6. Add environment variables from .env
# 7. Deploy!
```

**Step 4: Update Vue Frontend**

```bash
# .env.production
VITE_BACKEND_API_URL=https://your-app.railway.app/api
```

---

## Cost Breakdown

### Development
- **With AI assistance:** ~40 hours over 1 week
- **Your hourly rate:** $0 (you're helping Joseph)

### Hosting (Railway.app)
- **Hobby Plan:** $5/month (includes PostgreSQL + Redis)
- **Pro Plan:** $20/month (if needed for production)

### Total Monthly Cost
- **Railway:** $5-20/month
- **Domain (optional):** $1/month
- **Total:** $6-21/month

### Alternative: Self-Host on VPS
- **DigitalOcean Droplet:** $6/month (1GB RAM)
- Install PostgreSQL, Redis, Nginx yourself
- More work, same cost

---

## What Joseph Gets

1. **Clean Inventory Dashboard**
   - See all products at a glance
   - Edit FBM quantities with inline editing
   - Auto-sync to Amazon
   - No more navigating Seller Central's terrible UI

2. **Simple Order Fulfillment**
   - See all FBM orders that need shipping
   - Enter tracking, click Ship
   - Amazon updates automatically
   - No more clicking through 5 pages on Seller Central

3. **Automated Background Sync**
   - Orders sync every 15 minutes
   - Inventory syncs every hour
   - Always up-to-date without manual work

4. **Fast & Responsive**
   - SQLite means instant queries
   - Clean Vue UI (way better than Amazon's)
   - Mobile-friendly (Vuetify responsive design)

---

## Future Enhancements (Add Later if Needed)

**Week 2 additions:**
- Low stock alerts (email when inventory < threshold)
- Order search/filtering
- Export to CSV

**Month 2 additions:**
- Basic analytics (sales trends, top products)
- Bulk inventory updates
- Purchase order tracking

**Month 3+ additions:**
- Warehouse bin locations
- Barcode scanning app
- FBA shipment planning
- Multi-channel (eBay, Shopify)

---

## Tips for Using AI to Build This

### Prompts to Use with Claude/Cursor

**For Models:**
> "Generate Django models for an Amazon seller with products (SKU, ASIN, title, price, FBA quantity, FBM quantity) and orders (Amazon order ID, customer, shipping address, status, items)"

**For API Service:**
> "Create a Python class using the sp-api library to fetch orders, get FBA inventory, update FBM quantities, and confirm shipments"

**For Sync Logic:**
> "Write Django service to sync Amazon orders and inventory to local database with error handling and logging"

**For REST API:**
> "Generate Django REST Framework viewsets for Products and Orders with custom actions for updating quantities and shipping orders"

**For Vue Components:**
> "Create a Vuetify data table component that displays products, allows inline editing of quantities, and calls a Django API to update"

**For Debugging:**
> "I'm getting this error: [paste error]. Here's my code: [paste code]. How do I fix it?"

### Using Cursor

1. Open project in Cursor
2. Select all model files
3. Ask: "Generate serializers and viewsets for these models"
4. Cursor autocompletes entire files
5. Fix any errors by asking Claude inline

---

## Success Criteria

✅ Joseph can see all his Amazon products without using Seller Central
✅ Joseph can update FBM inventory and it syncs to Amazon
✅ Joseph can mark orders shipped with tracking numbers
✅ Amazon automatically gets updated when he ships orders
✅ Background tasks keep everything in sync
✅ Everything works on mobile (for warehouse operations)

**That's it. Simple, focused, solves the real problem.**

---

## Questions Before Starting?

1. **Does Joseph have Amazon SP-API credentials?** (Need LWA app, IAM role, etc.)
2. **Is he okay with $5-20/month hosting?** (Or wants to self-host?)
3. **Does he need mobile barcode scanning?** (Could add later with Progressive Web App)
4. **What timezone is he in?** (For Celery scheduled tasks)

---

**Bottom line:** With AI assistance, this goes from a 10-week project to a 1-week sprint. Focus on the 3 core features, skip everything else for now, and ship it.

Let me know when Joseph's ready to start and I'll help guide him through each day!
