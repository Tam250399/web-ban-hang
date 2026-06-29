using Minio;
using Minio.DataModel.Args;

namespace SalesManagerBE.Services
{
    public interface IMinioService
    {
        Task<string> UploadFileAsync(string bucketName, string objectName, Stream inputStream, string contentType);
    }

    public class MinioService : IMinioService
    {
        private readonly IMinioClient _minioClient;

        public MinioService(IMinioClient minioClient)
        {
            _minioClient = minioClient;
        }

        public async Task<string> UploadFileAsync(string bucketName, string objectName, Stream inputStream, string contentType)
        {
            var beArgs = new BucketExistsArgs().WithBucket(bucketName);
            bool found = await _minioClient.BucketExistsAsync(beArgs);
            if (!found)
            {
                var mbArgs = new MakeBucketArgs().WithBucket(bucketName);
                await _minioClient.MakeBucketAsync(mbArgs);
            }

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectName)
                .WithStreamData(inputStream)
                .WithObjectSize(inputStream.Length)
                .WithContentType(contentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            return $"http://localhost:9000/{bucketName}/{objectName}";
        }
    }
}