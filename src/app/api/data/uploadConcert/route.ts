import {writeFile} from "fs/promises";
import {NextRequest, NextResponse} from "next/server";
import {v4 as uuidv4} from "uuid";
import Concert from "@/models/concertModel";
import AWS from "aws-sdk";
import User from "@/models/userModel"

// Load AWS credentials and configuration from environment variables
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION,
});

const generateUUID = () => {
    return uuidv4();
  };

const s3 = new AWS.S3();

export async function POST(request: NextRequest) {
    const data = await request.formData();
    const file = data.get("file") as File;
    const concertId = generateUUID();
    const concertName = data.get("Concert_name");
    const concertDate = data.get("Concert_date");
    const concertStart = data.get("Concert_start");
    const concertDoors = data.get("Concert_doors");
    const concertArtistEmail = data.get("Concert_artist_email");
    const concertDescription = data.get("Concert_description");

    const concertGenre = {
        genre_name: data.get("Concert_genre_name"),
        genre_id: data.get("Concert_genre_id"),
    };

    const concertArtist = {
        artist_name: data.get("Concert_artist_name"),
        artist_id: data.get("Concert_artist_id"),
    };

    const concertVenue = {
        venue_name: data.get("Concert_venue_name"),
        venue_id: data.get("Concert_venue_id"),
    };

    if (!file) {
        return NextResponse.json({success: false});
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uuid = uuidv4();
    const fileExtension = file.name.split(".").pop();
    const newFileName = `${uuid}.${fileExtension}`;
    const s3BucketName = "concertify"; // Replace with your S3 bucket name
    const s3ObjectKey = `concert_images/${newFileName}`;

    const params = {
        Bucket: s3BucketName,
        Key: s3ObjectKey,
        Body: buffer,
    };

    try {
        await s3.upload(params).promise();
        console.log(`File uploaded to S3: ${s3ObjectKey}`);

        const concertImage = `concert_images/${newFileName}`;

        const newConcert = new Concert({
            concert_id: concertId,
            concert_name: concertName,
            concer_date: concertDate,
            concert_start: concertStart,
            concert_doors: concertDoors,
            concert_image: concertImage,
            concert_date: concertDate,
            concert_description: concertDescription,
            concert_genre: concertGenre,
            concert_artist: concertArtist,
            concert_venue: concertVenue,
            concert_artist_email: concertArtistEmail,
        });

        const savedConcert = await newConcert.save();
        console.log(savedConcert);

        if (concertArtistEmail) {
            const user = await User.findOne({email: concertArtistEmail});
            console.log(user)
    
            const newConcert = {
                concert_id: concertId,
                concert_name: concertName,
                concert_image: concertImage,
                concert_date: concertDescription,
                concert_venue: concertVenue,
                concert_start: concertStart,
            }
            user.concerts.push(newConcert);
            await user.save();
        }
        return NextResponse.json({success: true});
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        return NextResponse.json({success: false});
    }
}
