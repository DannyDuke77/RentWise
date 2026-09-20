import csv
from django.http import StreamingHttpResponse
from django.utils import timezone
from django.utils.text import slugify

class _EchoBuffer:
    def write(self, value):
        return value


def _payment_row(payment):
    return [
        payment.paid_on.strftime("%Y-%m-%d %H:%M"),
        payment.tenancy.unit.property.name,
        payment.tenancy.unit.name,
        str(payment.amount_paid),
        payment.payment_method,
        payment.category,
        payment.type,
        payment.reference or "",
        payment.notes or "",
    ]


CSV_HEADERS = [
    "Date",
    "Property",
    "Unit",
    "Amount",
    "Method",
    "Category",
    "Type",
    "Reference",
    "Notes",
]


def stream_payments_csv(queryset, filename_prefix="payments"):
    writer = csv.writer(_EchoBuffer())

    first_payment = queryset.first()
    business_name = None

    if first_payment:
        business_name = getattr(
            getattr(getattr(getattr(first_payment, "tenancy", None), "unit", None), "property", None),
            "business",
            None
        )
        if business_name:
            business_name = getattr(business_name, "company_name", None)

    if business_name:
        sanitized_biz = slugify(business_name).replace("-", "_")
        filename_base = f"{sanitized_biz}_{filename_prefix}"
    else:
        filename_base = filename_prefix

    def rows():
        if first_payment and business_name:
            yield writer.writerow([f"{business_name} Payments Statement"])

        yield writer.writerow(CSV_HEADERS)

        for payment in queryset.iterator():
            yield writer.writerow(_payment_row(payment))

    response = StreamingHttpResponse(rows(), content_type="text/csv")
    filename = f"{filename_base}_{timezone.now().strftime('%Y%m%d_%H%M')}.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response