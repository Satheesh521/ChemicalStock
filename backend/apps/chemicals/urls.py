from django.urls import path
from . import views

urlpatterns = [
    path('', views.ChemicalListView.as_view(), name='chemical-list'),
]
