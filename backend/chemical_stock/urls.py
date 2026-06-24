from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="Chemical Stock API",
      default_version='v1',
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Routes
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/clients/', include('apps.clients.urls')),
    path('api/v1/chemicals/', include('apps.chemicals.urls')),
    path('api/v1/inventory/', include('apps.inventory.urls')),
    path('api/v1/vendors/', include('apps.vendors.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    
    # Admin
    path('admin/', admin.site.urls),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
