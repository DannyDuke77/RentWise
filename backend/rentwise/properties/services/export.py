import csv
from django.http import StreamingHttpResponse
from django.utils import timezone


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

    def rows():
        first_payment = queryset.first()
        if first_payment:
            business_name = first_payment.tenancy.unit.property.business.company_name
            yield writer.writerow([f"{business_name} Payments Statement"])

        yield writer.writerow(CSV_HEADERS)

        for payment in queryset.iterator():
            yield writer.writerow(_payment_row(payment))

    response = StreamingHttpResponse(rows(), content_type="text/csv")
    filename = f"{filename_prefix}_{timezone.now().strftime('%Y%m%d_%H%M')}.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response