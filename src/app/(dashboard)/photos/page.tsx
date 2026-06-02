import { getPhotos } from "@/actions/photos";
import PhotosPageClient from "./photos-client";

export default async function PhotosPage() {
  const photos = await getPhotos();

  return <PhotosPageClient photos={photos} />;
}
