from django.urls import path
from . import views

urlpatterns = [
    path('stock/', views.StockEntryView.as_view(), name='stock-entry'),
]
