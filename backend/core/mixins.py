# core/mixins.py

from rest_framework.response import Response
from rest_framework import status

from core.services import compare_signatures
# from core.signature_model import compare_signatures_with_model

class SignatureVerificationMixin:
    def verify_signature(self, request):
        uploaded_signature = request.FILES.get('signature')
        if not uploaded_signature:
            return Response({"error": "Signature is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.signature_image:
            return Response({"error": "No stored signature found for this user."}, status=status.HTTP_403_FORBIDDEN)

        # Save uploaded signature temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            for chunk in uploaded_signature.chunks():
                temp_file.write(chunk)
            temp_signature_path = temp_file.name

        user_signature_path = request.user.signature_image.path

        similarity,passed = compare_signatures(user_signature_path, temp_signature_path)
        # You can set your threshold, e.g., 0.35 for 35%
        if not passed:
            return Response({
                "error": "Signature verification failed.",
                "similarity": f"{similarity:.2f}",
                "message": "The signature does not match your stored signature. Please try again."
            }, status=status.HTTP_403_FORBIDDEN)

        return None  # Passed
    

# from rest_framework.response import Response
# from rest_framework import status
# from core.otp_manager import OTPManager

# class OTPVerificationMixin:
#     def verify_otp(self, user, otp_code, request=None):
#         ip = request.META.get("REMOTE_ADDR", "unknown") if request else None
#         valid, error = OTPManager.verify_otp(user, otp_code, ip)
#         if not valid:
#             return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
#         return None
# core/mixins.py

from rest_framework.response import Response
from rest_framework import status
from core.otp_manager import OTPManager

class OTPVerificationMixin:
    def verify_otp(self, user, otp_code, request=None):
        ip = request.META.get("REMOTE_ADDR", "unknown") if request else None
        valid, error = OTPManager.verify_otp(user, otp_code, ip)
        if not valid:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        return None
