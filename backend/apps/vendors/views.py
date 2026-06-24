from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Vendor
from .serializers import VendorSerializer

class VendorListCreateView(generics.ListCreateAPIView):
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vendor.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class VendorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vendor.objects.all()

class VendorUpdateView(generics.UpdateAPIView):
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vendor.objects.all()

class VendorDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vendor.objects.all()
