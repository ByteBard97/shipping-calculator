# Django Backend Implementation Plan
## Warehouse Management & Amazon Integration System

**Last Updated:** October 2, 2025
**Target User:** Joseph (Guinea Pig Hay Seller)
**Purpose:** Centralized system to manage warehouse inventory, sync with Amazon, and track orders

---

## Executive Summary

This plan outlines how to build a Django-based backend that serves as the "source of truth" for Joseph's business, managing:
- **Warehouse inventory** (what's physically in stock)
- **Amazon inventory** (what's listed on Amazon)
- **Order fulfillment** (both FBA and FBM orders)
- **Automated synchronization** between warehouse and Amazon
- **Business analytics** and reporting

The system will replace the current local-only Vue app with a client-server architecture where the Django backend handles all Amazon API interactions, inventory logic, and data persistence.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3 + Vuetify)               │
│  - Dashboard & Analytics                                     │
│  - Inventory Management UI                                   │
│  - Order Tracking Interface                                  │
│  - Warehouse Operations                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │ REST API (JSON)
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Django Backend (Python 3.11+)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Django REST Framework API                             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Business Logic Layer                                  │  │
│  │  - Inventory reconciliation                           │  │
│  │  - Order processing                                    │  │
│  │  - Amazon sync orchestration                          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Celery Background Tasks                               │  │
│  │  - Scheduled syncs (every 15 min)                     │  │
│  │  - Order status updates                               │  │
│  │  - Inventory alerts                                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Database Models (PostgreSQL)                          │  │
│  │  - Products, Inventory, Orders, Shipments             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ SP-API SDK
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                Amazon Selling Partner API                    │
│  - Listings API (inventory sync)                             │
│  - Orders API (order retrieval)                              │
│  - Feeds API (bulk updates)                                  │
│  - Reports API (sales data)                                  │
│  - FBA Inventory API (FBA stock levels)                      │
│  - Notifications API (real-time events)                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Django Project Setup

**Goal:** Create a production-ready Django project structure

```bash
# Project structure
warehouse-backend/
├── config/                    # Django settings
│   ├── settings/
│   │   ├── base.py           # Shared settings
│   │   ├── development.py    # Local dev
│   │   └── production.py     # Production settings
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── products/             # Product catalog
│   ├── inventory/            # Warehouse inventory
│   ├── orders/               # Order management
│   ├── amazon/               # Amazon integration
│   └── analytics/            # Business intelligence
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
└── docker-compose.yml        # Local dev environment
```

**Key Dependencies:**
```txt
# requirements/base.txt
Django==5.0
djangorestframework==3.14
psycopg2-binary==2.9         # PostgreSQL
celery==5.3                   # Background tasks
redis==5.0                    # Celery broker
python-dotenv==1.0            # Environment variables
django-cors-headers==4.3      # CORS for Vue frontend
django-filter==23.5           # API filtering
sp-api==0.19                  # Amazon SP-API Python SDK
requests==2.31
python-dateutil==2.8
pillow==10.2                  # Image handling
```

### 1.2 Database Schema

**Core Models:**

```python
# apps/products/models.py
from django.db import models

class Product(models.Model):
    """Master product catalog"""
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    asin = models.CharField(max_length=10, blank=True, db_index=True)
    title = models.CharField(max_length=500)
    brand = models.CharField(max_length=100)
    category = models.CharField(max_length=100)

    # Pricing
    cost = models.DecimalField(max_digits=10, decimal_places=2)  # COGS
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Selling price

    # Physical attributes
    weight_oz = models.DecimalField(max_digits=8, decimal_places=2)
    length_in = models.DecimalField(max_digits=6, decimal_places=2)
    width_in = models.DecimalField(max_digits=6, decimal_places=2)
    height_in = models.DecimalField(max_digits=6, decimal_places=2)

    # Product details
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_hazmat = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sku']
        indexes = [
            models.Index(fields=['sku', 'is_active']),
            models.Index(fields=['asin']),
        ]


# apps/inventory/models.py
class WarehouseInventory(models.Model):
    """Physical inventory in Joseph's warehouse"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='warehouse_stock')

    # Stock levels
    quantity_available = models.IntegerField(default=0)  # Can be sold
    quantity_reserved = models.IntegerField(default=0)   # Allocated to orders
    quantity_damaged = models.IntegerField(default=0)    # Unsellable
    quantity_incoming = models.IntegerField(default=0)   # Expected from suppliers

    # Reorder settings
    reorder_point = models.IntegerField(default=0)
    reorder_quantity = models.IntegerField(default=0)

    # Location
    bin_location = models.CharField(max_length=50, blank=True)  # e.g., "A-12-3"

    # Timestamps
    last_counted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def quantity_on_hand(self):
        """Total physical units in warehouse"""
        return self.quantity_available + self.quantity_reserved + self.quantity_damaged

    @property
    def needs_reorder(self):
        """Check if stock is below reorder point"""
        return self.quantity_available <= self.reorder_point


class AmazonInventory(models.Model):
    """Inventory listed on Amazon (FBA + FBM)"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='amazon_stock')

    # FBA inventory
    fba_fulfillable = models.IntegerField(default=0)
    fba_inbound = models.IntegerField(default=0)
    fba_reserved = models.IntegerField(default=0)
    fba_unfulfillable = models.IntegerField(default=0)

    # FBM inventory (seller-fulfilled)
    fbm_quantity = models.IntegerField(default=0)

    # Listing status
    is_listed = models.BooleanField(default=False)
    listing_status = models.CharField(max_length=50, default='INACTIVE')  # ACTIVE, INACTIVE, INCOMPLETE

    # Sync tracking
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_error = models.TextField(blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_amazon_quantity(self):
        """Total units across FBA and FBM"""
        return self.fba_fulfillable + self.fbm_quantity


class InventoryAdjustment(models.Model):
    """Audit trail for inventory changes"""
    ADJUSTMENT_TYPES = [
        ('RECOUNT', 'Physical Count Adjustment'),
        ('DAMAGE', 'Damaged Goods'),
        ('FOUND', 'Found Inventory'),
        ('LOSS', 'Shrinkage/Loss'),
        ('RETURN', 'Customer Return'),
        ('SUPPLIER', 'Supplier Delivery'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='adjustments')
    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_TYPES)
    quantity_change = models.IntegerField()  # Positive or negative
    reason = models.TextField()

    # Before/after snapshots
    quantity_before = models.IntegerField()
    quantity_after = models.IntegerField()

    # Who and when
    created_by = models.CharField(max_length=100)  # Could be FK to User model
    created_at = models.DateTimeField(auto_now_add=True)


# apps/orders/models.py
class Order(models.Model):
    """Orders from all channels (Amazon, direct, etc.)"""
    ORDER_SOURCES = [
        ('AMAZON_FBA', 'Amazon FBA'),
        ('AMAZON_FBM', 'Amazon FBM'),
        ('DIRECT', 'Direct Sale'),
    ]

    ORDER_STATUSES = [
        ('PENDING', 'Pending'),
        ('UNSHIPPED', 'Unshipped'),
        ('PARTIALLY_SHIPPED', 'Partially Shipped'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    # Order identification
    order_id = models.CharField(max_length=100, unique=True, db_index=True)
    amazon_order_id = models.CharField(max_length=50, blank=True, db_index=True)
    source = models.CharField(max_length=20, choices=ORDER_SOURCES)
    status = models.CharField(max_length=20, choices=ORDER_STATUSES)

    # Customer info
    customer_name = models.CharField(max_length=200, blank=True)
    customer_email = models.EmailField(blank=True)

    # Shipping address
    ship_address_line1 = models.CharField(max_length=200)
    ship_address_line2 = models.CharField(max_length=200, blank=True)
    ship_city = models.CharField(max_length=100)
    ship_state = models.CharField(max_length=50)
    ship_postal_code = models.CharField(max_length=20)
    ship_country = models.CharField(max_length=2, default='US')

    # Financial
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Dates
    order_date = models.DateTimeField(db_index=True)
    ship_by_date = models.DateTimeField(null=True, blank=True)
    delivery_date = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['status', 'order_date']),
            models.Index(fields=['amazon_order_id']),
        ]


class OrderItem(models.Model):
    """Line items within an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)

    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Fulfillment tracking
    quantity_shipped = models.IntegerField(default=0)
    quantity_cancelled = models.IntegerField(default=0)

    @property
    def line_total(self):
        return self.quantity * self.unit_price

    @property
    def is_fully_shipped(self):
        return self.quantity_shipped >= self.quantity


class Shipment(models.Model):
    """Tracking for outbound shipments"""
    CARRIERS = [
        ('USPS', 'USPS'),
        ('UPS', 'UPS'),
        ('FEDEX', 'FedEx'),
        ('AMAZON', 'Amazon Logistics'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='shipments')

    # Tracking
    tracking_number = models.CharField(max_length=100, db_index=True)
    carrier = models.CharField(max_length=20, choices=CARRIERS)

    # Shipping details
    weight_oz = models.DecimalField(max_digits=8, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2)

    # Status
    shipped_at = models.DateTimeField()
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Label
    label_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
```

---

## Phase 2: Amazon Integration (Week 3-4)

### 2.1 SP-API Service Layer

**Goal:** Centralize all Amazon API interactions

```python
# apps/amazon/services/sp_api_client.py
from sp_api.api import Orders, Listings, FbaInventory, Feeds, Reports
from sp_api.base import SellingApiException
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class AmazonSPAPIClient:
    """Wrapper for Amazon SP-API operations"""

    def __init__(self):
        self.credentials = {
            'refresh_token': settings.AMAZON_REFRESH_TOKEN,
            'lwa_app_id': settings.AMAZON_CLIENT_ID,
            'lwa_client_secret': settings.AMAZON_CLIENT_SECRET,
            'aws_access_key': settings.AWS_ACCESS_KEY_ID,
            'aws_secret_key': settings.AWS_SECRET_ACCESS_KEY,
            'role_arn': settings.AMAZON_ROLE_ARN,
        }
        self.marketplace_id = settings.AMAZON_MARKETPLACE_ID  # ATVPDKIKX0DER (US)

    def get_orders(self, created_after=None, order_statuses=None):
        """
        Fetch orders from Amazon

        Args:
            created_after: datetime - Only orders created after this date
            order_statuses: list - e.g., ['Unshipped', 'PartiallyShipped']

        Returns:
            list of order dictionaries
        """
        try:
            orders_api = Orders(credentials=self.credentials, marketplace=Marketplaces.US)

            params = {
                'MarketplaceIds': [self.marketplace_id],
            }

            if created_after:
                params['CreatedAfter'] = created_after.isoformat()

            if order_statuses:
                params['OrderStatuses'] = order_statuses

            response = orders_api.get_orders(**params)

            orders = []
            if response.payload and 'Orders' in response.payload:
                orders = response.payload['Orders']

            logger.info(f"Retrieved {len(orders)} orders from Amazon")
            return orders

        except SellingApiException as e:
            logger.error(f"Amazon API error fetching orders: {e}")
            raise

    def get_order_items(self, amazon_order_id):
        """Fetch line items for a specific order"""
        try:
            orders_api = Orders(credentials=self.credentials, marketplace=Marketplaces.US)
            response = orders_api.get_order_items(amazon_order_id)

            items = []
            if response.payload and 'OrderItems' in response.payload:
                items = response.payload['OrderItems']

            return items

        except SellingApiException as e:
            logger.error(f"Error fetching items for order {amazon_order_id}: {e}")
            raise

    def get_fba_inventory(self):
        """Fetch FBA inventory levels"""
        try:
            fba_api = FbaInventory(credentials=self.credentials, marketplace=Marketplaces.US)
            response = fba_api.get_inventory_summaries(
                marketplaceIds=[self.marketplace_id]
            )

            inventory = []
            if response.payload and 'inventorySummaries' in response.payload:
                inventory = response.payload['inventorySummaries']

            logger.info(f"Retrieved FBA inventory for {len(inventory)} SKUs")
            return inventory

        except SellingApiException as e:
            logger.error(f"Error fetching FBA inventory: {e}")
            raise

    def get_listings(self, sku=None):
        """Fetch product listings"""
        try:
            listings_api = Listings(credentials=self.credentials, marketplace=Marketplaces.US)

            if sku:
                # Get specific listing
                response = listings_api.get_listings_item(
                    sellerId=settings.AMAZON_SELLER_ID,
                    sku=sku,
                    marketplaceIds=[self.marketplace_id]
                )
                return [response.payload] if response.payload else []
            else:
                # Get all listings (paginated)
                # Note: This endpoint doesn't exist in current SP-API
                # You'd need to maintain SKU list or use Reports API
                logger.warning("Bulk listing retrieval not implemented")
                return []

        except SellingApiException as e:
            logger.error(f"Error fetching listings: {e}")
            raise

    def update_listing_quantity(self, sku, quantity):
        """Update FBM quantity for a listing"""
        try:
            listings_api = Listings(credentials=self.credentials, marketplace=Marketplaces.US)

            # Construct patch document
            patches = [{
                'op': 'replace',
                'path': '/attributes/fulfillment_availability',
                'value': [{
                    'fulfillment_channel_code': 'DEFAULT',
                    'quantity': quantity
                }]
            }]

            response = listings_api.patch_listings_item(
                sellerId=settings.AMAZON_SELLER_ID,
                sku=sku,
                marketplaceIds=[self.marketplace_id],
                body={'patches': patches}
            )

            logger.info(f"Updated quantity for SKU {sku} to {quantity}")
            return response.payload

        except SellingApiException as e:
            logger.error(f"Error updating quantity for SKU {sku}: {e}")
            raise

    def confirm_shipment(self, amazon_order_id, tracking_number, carrier_code):
        """Confirm shipment for an FBM order"""
        try:
            orders_api = Orders(credentials=self.credentials, marketplace=Marketplaces.US)

            # Map carrier names to Amazon codes
            carrier_mapping = {
                'USPS': 'USPS',
                'UPS': 'UPS',
                'FEDEX': 'FedEx',
            }

            body = {
                'trackingNumber': tracking_number,
                'carrierCode': carrier_mapping.get(carrier_code, carrier_code)
            }

            response = orders_api.update_shipment_status(
                orderId=amazon_order_id,
                body=body
            )

            logger.info(f"Confirmed shipment for order {amazon_order_id}")
            return response.payload

        except SellingApiException as e:
            logger.error(f"Error confirming shipment: {e}")
            raise
```

### 2.2 Synchronization Logic

**Goal:** Keep warehouse and Amazon inventory in sync

```python
# apps/amazon/services/sync_service.py
from apps.products.models import Product
from apps.inventory.models import WarehouseInventory, AmazonInventory
from apps.orders.models import Order, OrderItem
from .sp_api_client import AmazonSPAPIClient
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


class AmazonSyncService:
    """Orchestrates synchronization between warehouse and Amazon"""

    def __init__(self):
        self.api = AmazonSPAPIClient()

    def sync_orders(self, hours_back=24):
        """
        Pull recent orders from Amazon and create local records

        This runs every 15 minutes via Celery
        """
        logger.info(f"Starting order sync for last {hours_back} hours")

        created_after = timezone.now() - timezone.timedelta(hours=hours_back)

        try:
            # Fetch orders from Amazon
            amazon_orders = self.api.get_orders(
                created_after=created_after,
                order_statuses=['Unshipped', 'PartiallyShipped']
            )

            orders_created = 0
            orders_updated = 0

            for amazon_order in amazon_orders:
                order, created = self._process_order(amazon_order)

                if created:
                    orders_created += 1
                    # Reserve inventory for new orders
                    self._reserve_inventory_for_order(order)
                else:
                    orders_updated += 1

            logger.info(f"Order sync complete: {orders_created} created, {orders_updated} updated")
            return {
                'success': True,
                'created': orders_created,
                'updated': orders_updated
            }

        except Exception as e:
            logger.error(f"Order sync failed: {e}")
            return {'success': False, 'error': str(e)}

    @transaction.atomic
    def _process_order(self, amazon_order):
        """Create or update Order from Amazon data"""
        amazon_order_id = amazon_order['AmazonOrderId']

        # Determine if FBA or FBM
        fulfillment_channel = amazon_order.get('FulfillmentChannel', 'MFN')
        source = 'AMAZON_FBA' if fulfillment_channel == 'AFN' else 'AMAZON_FBM'

        # Map Amazon status to our statuses
        status_mapping = {
            'Pending': 'PENDING',
            'Unshipped': 'UNSHIPPED',
            'PartiallyShipped': 'PARTIALLY_SHIPPED',
            'Shipped': 'SHIPPED',
            'Canceled': 'CANCELLED',
        }
        status = status_mapping.get(amazon_order['OrderStatus'], 'PENDING')

        # Parse shipping address
        ship_address = amazon_order.get('ShippingAddress', {})

        # Create or update order
        order, created = Order.objects.update_or_create(
            amazon_order_id=amazon_order_id,
            defaults={
                'order_id': amazon_order_id,
                'source': source,
                'status': status,
                'customer_name': ship_address.get('Name', ''),
                'ship_address_line1': ship_address.get('AddressLine1', ''),
                'ship_address_line2': ship_address.get('AddressLine2', ''),
                'ship_city': ship_address.get('City', ''),
                'ship_state': ship_address.get('StateOrRegion', ''),
                'ship_postal_code': ship_address.get('PostalCode', ''),
                'ship_country': ship_address.get('CountryCode', 'US'),
                'total_amount': amazon_order.get('OrderTotal', {}).get('Amount', 0),
                'order_date': amazon_order['PurchaseDate'],
            }
        )

        if created:
            # Fetch and create order items
            amazon_items = self.api.get_order_items(amazon_order_id)

            for item in amazon_items:
                sku = item['SellerSKU']

                try:
                    product = Product.objects.get(sku=sku)

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item['QuantityOrdered'],
                        unit_price=item['ItemPrice']['Amount'],
                        quantity_shipped=item.get('QuantityShipped', 0)
                    )
                except Product.DoesNotExist:
                    logger.warning(f"Product with SKU {sku} not found for order {amazon_order_id}")

        return order, created

    def _reserve_inventory_for_order(self, order):
        """Reserve warehouse inventory for FBM orders"""
        if order.source != 'AMAZON_FBM':
            return  # FBA orders don't affect warehouse inventory

        for item in order.items.all():
            try:
                warehouse_stock = item.product.warehouse_stock

                # Move from available to reserved
                if warehouse_stock.quantity_available >= item.quantity:
                    warehouse_stock.quantity_available -= item.quantity
                    warehouse_stock.quantity_reserved += item.quantity
                    warehouse_stock.save()

                    logger.info(f"Reserved {item.quantity} units of {item.product.sku} for order {order.order_id}")
                else:
                    logger.error(f"Insufficient inventory for {item.product.sku}: need {item.quantity}, have {warehouse_stock.quantity_available}")

            except WarehouseInventory.DoesNotExist:
                logger.error(f"No warehouse inventory record for product {item.product.sku}")

    def sync_fba_inventory(self):
        """Update FBA inventory levels from Amazon"""
        logger.info("Starting FBA inventory sync")

        try:
            fba_inventory = self.api.get_fba_inventory()

            updated_count = 0

            for item in fba_inventory:
                sku = item['sellerSku']

                try:
                    product = Product.objects.get(sku=sku)
                    amazon_stock, _ = AmazonInventory.objects.get_or_create(product=product)

                    # Update FBA quantities
                    amazon_stock.fba_fulfillable = item.get('totalQuantity', 0)
                    amazon_stock.fba_inbound = item.get('inboundWorkingQuantity', 0)
                    amazon_stock.fba_reserved = item.get('reservedQuantity', {}).get('totalReservedQuantity', 0)
                    amazon_stock.fba_unfulfillable = item.get('unfulfillableQuantity', 0)
                    amazon_stock.last_synced_at = timezone.now()
                    amazon_stock.save()

                    updated_count += 1

                except Product.DoesNotExist:
                    logger.warning(f"FBA inventory for unknown SKU: {sku}")

            logger.info(f"FBA inventory sync complete: {updated_count} SKUs updated")
            return {'success': True, 'updated': updated_count}

        except Exception as e:
            logger.error(f"FBA inventory sync failed: {e}")
            return {'success': False, 'error': str(e)}

    def push_fbm_inventory_to_amazon(self):
        """
        Update Amazon listings with current warehouse availability

        This ensures Amazon shows correct stock levels for FBM products
        """
        logger.info("Pushing FBM inventory to Amazon")

        try:
            # Get all active products with warehouse stock
            warehouse_stocks = WarehouseInventory.objects.filter(
                product__is_active=True
            ).select_related('product')

            updated_count = 0
            error_count = 0

            for stock in warehouse_stocks:
                try:
                    # Update Amazon listing with available quantity
                    self.api.update_listing_quantity(
                        sku=stock.product.sku,
                        quantity=stock.quantity_available
                    )

                    # Update local Amazon inventory record
                    amazon_stock, _ = AmazonInventory.objects.get_or_create(product=stock.product)
                    amazon_stock.fbm_quantity = stock.quantity_available
                    amazon_stock.last_synced_at = timezone.now()
                    amazon_stock.save()

                    updated_count += 1

                except Exception as e:
                    logger.error(f"Failed to update Amazon listing for {stock.product.sku}: {e}")
                    error_count += 1

            logger.info(f"FBM inventory push complete: {updated_count} updated, {error_count} errors")
            return {'success': True, 'updated': updated_count, 'errors': error_count}

        except Exception as e:
            logger.error(f"FBM inventory push failed: {e}")
            return {'success': False, 'error': str(e)}
```

---

## Phase 3: Background Tasks (Week 4)

### 3.1 Celery Setup

**Goal:** Automate recurring sync operations

```python
# config/celery.py
from celery import Celery
from celery.schedules import crontab
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('warehouse_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


# Scheduled tasks
app.conf.beat_schedule = {
    'sync-orders-every-15-minutes': {
        'task': 'apps.amazon.tasks.sync_orders',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'sync-fba-inventory-hourly': {
        'task': 'apps.amazon.tasks.sync_fba_inventory',
        'schedule': crontab(minute=0),  # Every hour
    },
    'push-fbm-inventory-hourly': {
        'task': 'apps.amazon.tasks.push_fbm_inventory',
        'schedule': crontab(minute=30),  # Every hour at :30
    },
    'check-reorder-alerts-daily': {
        'task': 'apps.inventory.tasks.check_reorder_alerts',
        'schedule': crontab(hour=8, minute=0),  # 8 AM daily
    },
    'generate-daily-sales-report': {
        'task': 'apps.analytics.tasks.generate_daily_report',
        'schedule': crontab(hour=23, minute=0),  # 11 PM daily
    },
}


# apps/amazon/tasks.py
from celery import shared_task
from .services.sync_service import AmazonSyncService
import logging

logger = logging.getLogger(__name__)


@shared_task
def sync_orders():
    """Celery task to sync orders from Amazon"""
    logger.info("Running scheduled order sync")
    service = AmazonSyncService()
    result = service.sync_orders(hours_back=24)
    return result


@shared_task
def sync_fba_inventory():
    """Celery task to sync FBA inventory"""
    logger.info("Running scheduled FBA inventory sync")
    service = AmazonSyncService()
    result = service.sync_fba_inventory()
    return result


@shared_task
def push_fbm_inventory():
    """Celery task to push warehouse inventory to Amazon"""
    logger.info("Running scheduled FBM inventory push")
    service = AmazonSyncService()
    result = service.push_fbm_inventory_to_amazon()
    return result


# apps/inventory/tasks.py
@shared_task
def check_reorder_alerts():
    """Check for products below reorder point and send alerts"""
    from apps.inventory.models import WarehouseInventory
    from django.core.mail import send_mail

    low_stock = WarehouseInventory.objects.filter(
        quantity_available__lte=models.F('reorder_point')
    ).select_related('product')

    if low_stock.exists():
        message = "Products needing reorder:\n\n"
        for stock in low_stock:
            message += f"- {stock.product.sku}: {stock.quantity_available} units (reorder at {stock.reorder_point})\n"

        send_mail(
            subject='Inventory Reorder Alert',
            message=message,
            from_email='noreply@josephshay.com',
            recipient_list=['joseph@josephshay.com'],
        )

        logger.info(f"Sent reorder alert for {low_stock.count()} products")

    return {'low_stock_count': low_stock.count()}
```

### 3.2 Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: warehouse_db
      POSTGRES_USER: joseph
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://joseph:dev_password@db:5432/warehouse_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    env_file:
      - .env

  celery_worker:
    build: .
    command: celery -A config worker -l info
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgres://joseph:dev_password@db:5432/warehouse_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    env_file:
      - .env

  celery_beat:
    build: .
    command: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgres://joseph:dev_password@db:5432/warehouse_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    env_file:
      - .env

volumes:
  postgres_data:
```

---

## Phase 4: REST API Endpoints (Week 5)

### 4.1 Django REST Framework Views

```python
# apps/inventory/serializers.py
from rest_framework import serializers
from apps.products.models import Product
from apps.inventory.models import WarehouseInventory, AmazonInventory


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class WarehouseInventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    quantity_on_hand = serializers.IntegerField(read_only=True)
    needs_reorder = serializers.BooleanField(read_only=True)

    class Meta:
        model = WarehouseInventory
        fields = '__all__'


class AmazonInventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    total_amazon_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = AmazonInventory
        fields = '__all__'


class CombinedInventorySerializer(serializers.Serializer):
    """Combined view of warehouse + Amazon inventory"""
    product = ProductSerializer()
    warehouse_available = serializers.IntegerField()
    warehouse_reserved = serializers.IntegerField()
    amazon_fba = serializers.IntegerField()
    amazon_fbm = serializers.IntegerField()
    total_available = serializers.IntegerField()
    needs_reorder = serializers.BooleanField()


# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Q
from apps.products.models import Product
from .models import WarehouseInventory, AmazonInventory, InventoryAdjustment
from .serializers import WarehouseInventorySerializer, CombinedInventorySerializer


class InventoryViewSet(viewsets.ModelViewSet):
    """API endpoints for inventory management"""
    queryset = WarehouseInventory.objects.select_related('product')
    serializer_class = WarehouseInventorySerializer
    filterset_fields = ['product__sku', 'bin_location']
    search_fields = ['product__title', 'product__sku']
    ordering_fields = ['quantity_available', 'updated_at']

    @action(detail=False, methods=['get'])
    def combined(self, request):
        """
        Get combined warehouse + Amazon inventory view

        GET /api/inventory/combined/
        """
        products = Product.objects.filter(is_active=True).prefetch_related(
            'warehouse_stock', 'amazon_stock'
        )

        combined_data = []
        for product in products:
            try:
                warehouse = product.warehouse_stock
                amazon = product.amazon_stock
            except:
                continue

            combined_data.append({
                'product': product,
                'warehouse_available': warehouse.quantity_available,
                'warehouse_reserved': warehouse.quantity_reserved,
                'amazon_fba': amazon.fba_fulfillable,
                'amazon_fbm': amazon.fbm_quantity,
                'total_available': warehouse.quantity_available + amazon.fba_fulfillable + amazon.fbm_quantity,
                'needs_reorder': warehouse.needs_reorder
            })

        serializer = CombinedInventorySerializer(combined_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get products below reorder point

        GET /api/inventory/low_stock/
        """
        low_stock = self.queryset.filter(
            quantity_available__lte=F('reorder_point')
        )
        serializer = self.get_serializer(low_stock, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """
        Adjust warehouse inventory quantity

        POST /api/inventory/{id}/adjust/
        {
            "adjustment_type": "RECOUNT",
            "quantity_change": 10,
            "reason": "Physical count found 10 extra units"
        }
        """
        inventory = self.get_object()

        adjustment_type = request.data.get('adjustment_type')
        quantity_change = int(request.data.get('quantity_change', 0))
        reason = request.data.get('reason', '')

        # Record adjustment
        quantity_before = inventory.quantity_available
        inventory.quantity_available += quantity_change
        quantity_after = inventory.quantity_available
        inventory.save()

        InventoryAdjustment.objects.create(
            product=inventory.product,
            adjustment_type=adjustment_type,
            quantity_change=quantity_change,
            reason=reason,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            created_by=request.user.username if request.user.is_authenticated else 'system'
        )

        return Response({
            'success': True,
            'quantity_before': quantity_before,
            'quantity_after': quantity_after
        })


# apps/orders/views.py
class OrderViewSet(viewsets.ModelViewSet):
    """API endpoints for order management"""
    queryset = Order.objects.prefetch_related('items__product', 'shipments')
    serializer_class = OrderSerializer
    filterset_fields = ['status', 'source']
    search_fields = ['order_id', 'amazon_order_id', 'customer_name']
    ordering_fields = ['order_date', 'ship_by_date']

    @action(detail=False, methods=['get'])
    def pending_shipment(self, request):
        """
        Get FBM orders that need to be shipped

        GET /api/orders/pending_shipment/
        """
        pending = self.queryset.filter(
            source='AMAZON_FBM',
            status__in=['UNSHIPPED', 'PARTIALLY_SHIPPED']
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """
        Mark order as shipped and create tracking

        POST /api/orders/{id}/ship/
        {
            "tracking_number": "9400123456789012345678",
            "carrier": "USPS",
            "weight_oz": 16,
            "shipping_cost": 8.50
        }
        """
        order = self.get_object()

        from apps.orders.models import Shipment
        from apps.amazon.services.sp_api_client import AmazonSPAPIClient

        # Create shipment record
        shipment = Shipment.objects.create(
            order=order,
            tracking_number=request.data['tracking_number'],
            carrier=request.data['carrier'],
            weight_oz=request.data['weight_oz'],
            shipping_cost=request.data['shipping_cost'],
            shipped_at=timezone.now()
        )

        # Update order status
        order.status = 'SHIPPED'
        order.save()

        # Release reserved inventory
        for item in order.items.all():
            warehouse = item.product.warehouse_stock
            warehouse.quantity_reserved -= item.quantity
            warehouse.save()

        # Notify Amazon (for FBM orders)
        if order.amazon_order_id:
            try:
                api = AmazonSPAPIClient()
                api.confirm_shipment(
                    amazon_order_id=order.amazon_order_id,
                    tracking_number=shipment.tracking_number,
                    carrier_code=shipment.carrier
                )
            except Exception as e:
                logger.error(f"Failed to confirm shipment with Amazon: {e}")

        return Response({
            'success': True,
            'shipment_id': shipment.id,
            'tracking_number': shipment.tracking_number
        })


# apps/amazon/views.py
class AmazonSyncViewSet(viewsets.ViewSet):
    """Manual trigger endpoints for Amazon sync"""

    @action(detail=False, methods=['post'])
    def sync_orders(self, request):
        """
        Manually trigger order sync

        POST /api/amazon/sync_orders/
        """
        from .tasks import sync_orders
        task = sync_orders.delay()
        return Response({
            'success': True,
            'task_id': task.id,
            'message': 'Order sync started'
        })

    @action(detail=False, methods=['post'])
    def sync_fba_inventory(self, request):
        """POST /api/amazon/sync_fba_inventory/"""
        from .tasks import sync_fba_inventory
        task = sync_fba_inventory.delay()
        return Response({
            'success': True,
            'task_id': task.id,
            'message': 'FBA inventory sync started'
        })

    @action(detail=False, methods=['post'])
    def push_fbm_inventory(self, request):
        """POST /api/amazon/push_fbm_inventory/"""
        from .tasks import push_fbm_inventory
        task = push_fbm_inventory.delay()
        return Response({
            'success': True,
            'task_id': task.id,
            'message': 'FBM inventory push started'
        })
```

### 4.2 URL Configuration

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inventory.views import InventoryViewSet
from apps.orders.views import OrderViewSet
from apps.amazon.views import AmazonSyncViewSet

router = DefaultRouter()
router.register('inventory', InventoryViewSet, basename='inventory')
router.register('orders', OrderViewSet, basename='orders')
router.register('amazon', AmazonSyncViewSet, basename='amazon')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),  # Login/logout for browsable API
]
```

---

## Phase 5: Analytics & Reporting (Week 6)

### 5.1 Business Intelligence Models

```python
# apps/analytics/models.py
from django.db import models
from apps.products.models import Product


class DailySalesMetrics(models.Model):
    """Daily snapshot of sales performance"""
    date = models.DateField(unique=True, db_index=True)

    # Orders
    total_orders = models.IntegerField(default=0)
    fba_orders = models.IntegerField(default=0)
    fbm_orders = models.IntegerField(default=0)

    # Revenue
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Amazon fees
    amazon_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_costs = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Units
    total_units_sold = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'Daily sales metrics'


class ProductPerformance(models.Model):
    """Product-level performance tracking"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='performance')
    date = models.DateField(db_index=True)

    # Sales
    units_sold = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Metrics
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    page_views = models.IntegerField(default=0)

    # Inventory
    stock_level_end_of_day = models.IntegerField(default=0)

    class Meta:
        ordering = ['-date', 'product']
        unique_together = ['product', 'date']
```

### 5.2 Analytics Service

```python
# apps/analytics/services.py
from apps.orders.models import Order, OrderItem
from apps.analytics.models import DailySalesMetrics, ProductPerformance
from django.utils import timezone
from django.db.models import Sum, Count, F
from datetime import date, timedelta


class AnalyticsService:
    """Generate business intelligence reports"""

    def generate_daily_metrics(self, target_date=None):
        """
        Calculate and store daily sales metrics

        Runs automatically at end of day via Celery
        """
        if target_date is None:
            target_date = (timezone.now() - timedelta(days=1)).date()

        # Get all orders for the day
        orders = Order.objects.filter(
            order_date__date=target_date
        )

        # Aggregate order data
        fba_orders = orders.filter(source='AMAZON_FBA').count()
        fbm_orders = orders.filter(source='AMAZON_FBM').count()

        revenue_data = orders.aggregate(
            total_revenue=Sum('total_amount'),
            total_shipping=Sum('shipping_amount')
        )

        # Calculate costs (COGS)
        items = OrderItem.objects.filter(order__order_date__date=target_date)
        cost_data = items.aggregate(
            total_units=Sum('quantity'),
            total_costs=Sum(F('quantity') * F('product__cost'))
        )

        # Amazon fees (would need to calculate based on category)
        # Simplified: assume 15% referral fee
        amazon_fees = (revenue_data['total_revenue'] or 0) * 0.15

        gross_profit = (revenue_data['total_revenue'] or 0) - (cost_data['total_costs'] or 0) - amazon_fees

        # Create or update metrics
        metrics, _ = DailySalesMetrics.objects.update_or_create(
            date=target_date,
            defaults={
                'total_orders': orders.count(),
                'fba_orders': fba_orders,
                'fbm_orders': fbm_orders,
                'total_revenue': revenue_data['total_revenue'] or 0,
                'total_costs': cost_data['total_costs'] or 0,
                'gross_profit': gross_profit,
                'amazon_fees': amazon_fees,
                'shipping_costs': revenue_data['total_shipping'] or 0,
                'total_units_sold': cost_data['total_units'] or 0,
            }
        )

        return metrics

    def get_sales_trend(self, days=30):
        """Get sales trend for last N days"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        metrics = DailySalesMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).order_by('date')

        return {
            'dates': [m.date.isoformat() for m in metrics],
            'revenue': [float(m.total_revenue) for m in metrics],
            'profit': [float(m.gross_profit) for m in metrics],
            'orders': [m.total_orders for m in metrics],
        }

    def get_top_products(self, days=30, limit=10):
        """Get best-selling products"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        top_products = ProductPerformance.objects.filter(
            date__range=[start_date, end_date]
        ).values('product__sku', 'product__title').annotate(
            total_units=Sum('units_sold'),
            total_revenue=Sum('revenue')
        ).order_by('-total_revenue')[:limit]

        return list(top_products)

    def get_inventory_turnover(self):
        """Calculate inventory turnover ratio"""
        # Units sold in last 30 days
        thirty_days_ago = timezone.now().date() - timedelta(days=30)

        recent_metrics = DailySalesMetrics.objects.filter(
            date__gte=thirty_days_ago
        ).aggregate(
            total_units=Sum('total_units_sold')
        )

        units_sold = recent_metrics['total_units'] or 0

        # Average inventory (from warehouse)
        from apps.inventory.models import WarehouseInventory
        avg_inventory = WarehouseInventory.objects.aggregate(
            avg_qty=Sum('quantity_on_hand')
        )['avg_qty'] or 1

        # Turnover = units sold / average inventory
        turnover = units_sold / avg_inventory if avg_inventory else 0

        return {
            'turnover_ratio': round(turnover, 2),
            'units_sold_30d': units_sold,
            'avg_inventory': avg_inventory
        }
```

---

## Phase 6: Frontend Integration (Week 7-8)

### 6.1 Vue Frontend Updates

**Update the existing Vue app to call the Django backend:**

```typescript
// src/services/api.ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Inventory endpoints
export const inventoryApi = {
  async getCombinedInventory() {
    const response = await api.get('/inventory/combined/')
    return response.data
  },

  async getLowStock() {
    const response = await api.get('/inventory/low_stock/')
    return response.data
  },

  async adjustInventory(inventoryId: number, data: {
    adjustment_type: string
    quantity_change: number
    reason: string
  }) {
    const response = await api.post(`/inventory/${inventoryId}/adjust/`, data)
    return response.data
  }
}

// Orders endpoints
export const ordersApi = {
  async getPendingOrders() {
    const response = await api.get('/orders/pending_shipment/')
    return response.data
  },

  async shipOrder(orderId: number, data: {
    tracking_number: string
    carrier: string
    weight_oz: number
    shipping_cost: number
  }) {
    const response = await api.post(`/orders/${orderId}/ship/`, data)
    return response.data
  },

  async getOrders(params?: {
    status?: string
    source?: string
    page?: number
  }) {
    const response = await api.get('/orders/', { params })
    return response.data
  }
}

// Amazon sync endpoints
export const amazonApi = {
  async syncOrders() {
    const response = await api.post('/amazon/sync_orders/')
    return response.data
  },

  async syncFBAInventory() {
    const response = await api.post('/amazon/sync_fba_inventory/')
    return response.data
  },

  async pushFBMInventory() {
    const response = await api.post('/amazon/push_fbm_inventory/')
    return response.data
  }
}

// Analytics endpoints
export const analyticsApi = {
  async getSalesTrend(days = 30) {
    const response = await api.get('/analytics/sales_trend/', { params: { days } })
    return response.data
  },

  async getTopProducts(days = 30, limit = 10) {
    const response = await api.get('/analytics/top_products/', { params: { days, limit } })
    return response.data
  },

  async getInventoryTurnover() {
    const response = await api.get('/analytics/inventory_turnover/')
    return response.data
  }
}
```

### 6.2 New Vue Components

**Warehouse Inventory Management:**

```vue
<!-- src/components/WarehouseInventoryManager.vue -->
<template>
  <v-card>
    <v-card-title>Warehouse Inventory</v-card-title>

    <v-card-text>
      <!-- Low stock alert -->
      <v-alert v-if="lowStock.length > 0" type="warning" class="mb-4">
        {{ lowStock.length }} products below reorder point
      </v-alert>

      <!-- Combined inventory table -->
      <v-data-table
        :headers="headers"
        :items="inventory"
        :loading="loading"
        :search="search"
      >
        <template v-slot:top>
          <v-text-field
            v-model="search"
            label="Search products"
            prepend-inner-icon="mdi-magnify"
            clearable
          />
        </template>

        <template v-slot:item.needs_reorder="{ item }">
          <v-chip :color="item.needs_reorder ? 'error' : 'success'" size="small">
            {{ item.needs_reorder ? 'Low Stock' : 'OK' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" @click="openAdjustDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Adjustment dialog -->
    <v-dialog v-model="adjustDialog" max-width="500">
      <v-card>
        <v-card-title>Adjust Inventory</v-card-title>
        <v-card-text>
          <v-select
            v-model="adjustment.type"
            :items="adjustmentTypes"
            label="Adjustment Type"
          />
          <v-text-field
            v-model.number="adjustment.quantity"
            type="number"
            label="Quantity Change"
            hint="Use negative numbers to decrease"
          />
          <v-textarea
            v-model="adjustment.reason"
            label="Reason"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="adjustDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="submitAdjustment">Submit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { inventoryApi } from '@/services/api'

const inventory = ref([])
const lowStock = ref([])
const loading = ref(false)
const search = ref('')
const adjustDialog = ref(false)
const selectedItem = ref(null)

const adjustment = ref({
  type: 'RECOUNT',
  quantity: 0,
  reason: ''
})

const headers = [
  { title: 'SKU', key: 'product.sku' },
  { title: 'Product', key: 'product.title' },
  { title: 'Warehouse', key: 'warehouse_available' },
  { title: 'Reserved', key: 'warehouse_reserved' },
  { title: 'Amazon FBA', key: 'amazon_fba' },
  { title: 'Amazon FBM', key: 'amazon_fbm' },
  { title: 'Total', key: 'total_available' },
  { title: 'Status', key: 'needs_reorder' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const adjustmentTypes = [
  { title: 'Physical Count', value: 'RECOUNT' },
  { title: 'Damaged Goods', value: 'DAMAGE' },
  { title: 'Found Inventory', value: 'FOUND' },
  { title: 'Loss/Shrinkage', value: 'LOSS' },
  { title: 'Customer Return', value: 'RETURN' },
  { title: 'Supplier Delivery', value: 'SUPPLIER' },
]

async function loadInventory() {
  loading.value = true
  try {
    inventory.value = await inventoryApi.getCombinedInventory()
    lowStock.value = await inventoryApi.getLowStock()
  } catch (error) {
    console.error('Failed to load inventory:', error)
  } finally {
    loading.value = false
  }
}

function openAdjustDialog(item: any) {
  selectedItem.value = item
  adjustDialog.value = true
}

async function submitAdjustment() {
  try {
    await inventoryApi.adjustInventory(selectedItem.value.id, {
      adjustment_type: adjustment.value.type,
      quantity_change: adjustment.value.quantity,
      reason: adjustment.value.reason
    })

    adjustDialog.value = false
    loadInventory()
  } catch (error) {
    console.error('Failed to adjust inventory:', error)
  }
}

onMounted(() => {
  loadInventory()
})
</script>
```

**Order Fulfillment Dashboard:**

```vue
<!-- src/components/OrderFulfillmentDashboard.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Pending Shipments
            <v-spacer />
            <v-btn color="primary" @click="refreshOrders">
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="pendingOrders"
              :loading="loading"
            >
              <template v-slot:item.order_date="{ item }">
                {{ formatDate(item.order_date) }}
              </template>

              <template v-slot:item.ship_by_date="{ item }">
                <v-chip :color="isUrgent(item.ship_by_date) ? 'error' : 'default'" size="small">
                  {{ formatDate(item.ship_by_date) }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn color="primary" size="small" @click="openShipDialog(item)">
                  Ship Order
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ship order dialog -->
    <v-dialog v-model="shipDialog" max-width="600">
      <v-card>
        <v-card-title>Ship Order {{ selectedOrder?.order_id }}</v-card-title>
        <v-card-text>
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
          <v-text-field
            v-model.number="shipment.weight_oz"
            type="number"
            label="Weight (oz)"
            required
          />
          <v-text-field
            v-model.number="shipment.shipping_cost"
            type="number"
            label="Shipping Cost ($)"
            step="0.01"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="shipDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="submitShipment">Confirm Shipment</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ordersApi } from '@/services/api'
import { format, isPast } from 'date-fns'

const pendingOrders = ref([])
const loading = ref(false)
const shipDialog = ref(false)
const selectedOrder = ref(null)

const shipment = ref({
  tracking_number: '',
  carrier: 'USPS',
  weight_oz: 0,
  shipping_cost: 0
})

const headers = [
  { title: 'Order ID', key: 'order_id' },
  { title: 'Customer', key: 'customer_name' },
  { title: 'Order Date', key: 'order_date' },
  { title: 'Ship By', key: 'ship_by_date' },
  { title: 'Total', key: 'total_amount' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const carriers = ['USPS', 'UPS', 'FEDEX']

async function refreshOrders() {
  loading.value = true
  try {
    pendingOrders.value = await ordersApi.getPendingOrders()
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

function isUrgent(shipByDate: string) {
  return isPast(new Date(shipByDate))
}

function openShipDialog(order: any) {
  selectedOrder.value = order
  shipDialog.value = true
}

async function submitShipment() {
  try {
    await ordersApi.shipOrder(selectedOrder.value.id, shipment.value)
    shipDialog.value = false
    refreshOrders()
  } catch (error) {
    console.error('Failed to ship order:', error)
  }
}

onMounted(() => {
  refreshOrders()
})
</script>
```

---

## Phase 7: Additional Features

### 7.1 FBA Shipment Planning

**Help Joseph plan shipments to Amazon warehouses:**

```python
# apps/fba/models.py
class FBAShipmentPlan(models.Model):
    """Plan for sending inventory to Amazon FBA"""
    STATUSES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted to Amazon'),
        ('IN_TRANSIT', 'In Transit'),
        ('RECEIVED', 'Received by Amazon'),
    ]

    shipment_id = models.CharField(max_length=100, unique=True)
    destination_fc = models.CharField(max_length=50)  # Fulfillment center code
    status = models.CharField(max_length=20, choices=STATUSES, default='DRAFT')

    estimated_arrival = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class FBAShipmentItem(models.Model):
    """Items in an FBA shipment"""
    shipment = models.ForeignKey(FBAShipmentPlan, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
```

### 7.2 Supplier Management

**Track suppliers and purchase orders:**

```python
# apps/suppliers/models.py
class Supplier(models.Model):
    """Hay suppliers"""
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    address_line1 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)

    lead_time_days = models.IntegerField(default=7)

    is_active = models.BooleanField(default=True)


class PurchaseOrder(models.Model):
    """Purchase orders to suppliers"""
    STATUSES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent to Supplier'),
        ('CONFIRMED', 'Confirmed by Supplier'),
        ('IN_TRANSIT', 'In Transit'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    po_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    status = models.CharField(max_length=20, choices=STATUSES, default='DRAFT')

    order_date = models.DateField()
    expected_delivery = models.DateField()
    actual_delivery = models.DateField(null=True, blank=True)

    total_cost = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.TextField(blank=True)


class PurchaseOrderItem(models.Model):
    """Line items in purchase order"""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity_ordered = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
```

### 7.3 Barcode Scanning Integration

**For warehouse operations:**

```python
# apps/warehouse/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.products.models import Product
from apps.inventory.models import WarehouseInventory


@api_view(['POST'])
def scan_barcode(request):
    """
    Handle barcode scans in warehouse

    POST /api/warehouse/scan/
    {
        "barcode": "123456789012",
        "action": "pick",  # or "receive", "move", "count"
        "quantity": 1
    }
    """
    barcode = request.data.get('barcode')
    action = request.data.get('action')
    quantity = int(request.data.get('quantity', 1))

    try:
        # Look up product by SKU or UPC
        product = Product.objects.get(
            models.Q(sku=barcode) | models.Q(upc=barcode)
        )

        warehouse_stock = product.warehouse_stock

        if action == 'pick':
            # Picking for an order
            if warehouse_stock.quantity_available >= quantity:
                warehouse_stock.quantity_available -= quantity
                warehouse_stock.quantity_reserved += quantity
                warehouse_stock.save()
                result = 'success'
                message = f'Picked {quantity} of {product.title}'
            else:
                result = 'error'
                message = f'Insufficient stock: only {warehouse_stock.quantity_available} available'

        elif action == 'receive':
            # Receiving from supplier
            warehouse_stock.quantity_available += quantity
            warehouse_stock.save()
            result = 'success'
            message = f'Received {quantity} of {product.title}'

        elif action == 'count':
            # Physical count
            result = 'info'
            message = f'Current count: {warehouse_stock.quantity_on_hand}'

        return Response({
            'result': result,
            'message': message,
            'product': {
                'sku': product.sku,
                'title': product.title,
                'quantity_available': warehouse_stock.quantity_available,
                'bin_location': warehouse_stock.bin_location
            }
        })

    except Product.DoesNotExist:
        return Response({
            'result': 'error',
            'message': f'Product not found for barcode: {barcode}'
        }, status=404)
```

---

## Deployment Guide

### Production Setup

**1. VPS Requirements (DigitalOcean/AWS/Linode):**
- 2 CPU cores
- 4 GB RAM
- 50 GB SSD
- Ubuntu 22.04 LTS

**2. Tech Stack:**
```bash
# System dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv postgresql redis nginx

# Create app user
sudo useradd -m -s /bin/bash warehouse
sudo su - warehouse

# Clone repo and setup
git clone https://github.com/joseph/warehouse-backend.git
cd warehouse-backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements/production.txt

# Environment variables
cat > .env << EOF
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgres://warehouse_user:password@localhost:5432/warehouse_db
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=warehouse.josephshay.com
DEBUG=False

# Amazon credentials
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_CLIENT_SECRET=secret_xxx
AMAZON_REFRESH_TOKEN=Atzr|token_xxx
AMAZON_SELLER_ID=A123456789012
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_ROLE_ARN=arn:aws:iam::123456789012:role/SellerPartnerAPI
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=secret...
EOF

# Database setup
sudo -u postgres createdb warehouse_db
sudo -u postgres createuser warehouse_user
python manage.py migrate
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

**3. Systemd Services:**

```ini
# /etc/systemd/system/warehouse-web.service
[Unit]
Description=Warehouse Backend Web
After=network.target

[Service]
Type=notify
User=warehouse
Group=warehouse
WorkingDirectory=/home/warehouse/warehouse-backend
Environment="PATH=/home/warehouse/warehouse-backend/venv/bin"
ExecStart=/home/warehouse/warehouse-backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/warehouse.sock \
    config.wsgi:application

[Install]
WantedBy=multi-user.target


# /etc/systemd/system/warehouse-celery.service
[Unit]
Description=Warehouse Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=warehouse
Group=warehouse
WorkingDirectory=/home/warehouse/warehouse-backend
Environment="PATH=/home/warehouse/warehouse-backend/venv/bin"
ExecStart=/home/warehouse/warehouse-backend/venv/bin/celery -A config worker -l info

[Install]
WantedBy=multi-user.target


# /etc/systemd/system/warehouse-celerybeat.service
[Unit]
Description=Warehouse Celery Beat
After=network.target redis.service

[Service]
Type=simple
User=warehouse
Group=warehouse
WorkingDirectory=/home/warehouse/warehouse-backend
Environment="PATH=/home/warehouse/warehouse-backend/venv/bin"
ExecStart=/home/warehouse/warehouse-backend/venv/bin/celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

[Install]
WantedBy=multi-user.target
```

**4. Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/warehouse
server {
    listen 80;
    server_name warehouse.josephshay.com;

    location /static/ {
        alias /home/warehouse/warehouse-backend/staticfiles/;
    }

    location /media/ {
        alias /home/warehouse/warehouse-backend/media/;
    }

    location / {
        proxy_pass http://unix:/run/warehouse.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Cost Estimate

### Development Costs (Your Time)
- Phase 1-2: 40 hours (foundation + Amazon integration)
- Phase 3-4: 30 hours (background tasks + API)
- Phase 5-6: 30 hours (analytics + frontend)
- Phase 7: 20 hours (additional features)
- Testing & bug fixes: 20 hours
**Total: ~140 hours**

### Ongoing Costs
- **VPS Hosting**: $24/month (DigitalOcean 4GB droplet)
- **Domain**: $12/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Database Backups**: $5/month (automated backups)
- **Total Monthly**: ~$30/month

### Alternative (Fully Managed)
- **Railway.app / Render.com**: $40-60/month (includes DB, Redis, auto-deploy)

---

## Key Benefits

1. **Single Source of Truth**: Django database is authoritative for all inventory
2. **Automated Sync**: No manual data entry between warehouse and Amazon
3. **Real-time Visibility**: See exact stock levels across all channels
4. **Order Tracking**: Track every order from placement to delivery
5. **Business Intelligence**: Understand what's selling, profitability, trends
6. **Scalability**: Can handle growth (more products, more orders, more marketplaces)
7. **Multi-channel Ready**: Easy to add eBay, Walmart, Shopify later

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 | Week 1-2 | Django project, database models, PostgreSQL setup |
| 2 | Week 3-4 | Amazon SP-API integration, sync logic |
| 3 | Week 4 | Celery background tasks, scheduled syncs |
| 4 | Week 5 | REST API endpoints, DRF views |
| 5 | Week 6 | Analytics, reporting, business intelligence |
| 6 | Week 7-8 | Frontend integration, Vue components |
| 7 | Week 9 | Additional features (FBA planning, suppliers, barcode) |
| 8 | Week 10 | Testing, deployment, documentation |

**Total: 10 weeks part-time** (20-30 hours/week)

---

## Next Steps

1. **Validate with Joseph**: Confirm this solves his actual pain points
2. **Prioritize Features**: Decide which phases are must-have vs nice-to-have
3. **Set Up Dev Environment**: Install Python, PostgreSQL, Redis locally
4. **Start with Phase 1**: Build the foundation and models
5. **Iterate**: Get Joseph testing early and often

---

*This plan assumes Joseph wants a robust, production-grade system. If he just needs basic inventory sync, you could cut this down to 4-6 weeks by focusing only on Phases 1-4.*
