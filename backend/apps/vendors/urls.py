from django.urls import path
from . import views

app_name = 'vendors'

urlpatterns = [
    path('', views.VendorListCreateView.as_view(), name='vendor-list-create'),
    path('<int:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),
    path('<int:pk>/update/', views.VendorUpdateView.as_view(), name='vendor-update'),
    path('<int:pk>/delete/', views.VendorDeleteView.as_view(), name='vendor-delete'),
]
