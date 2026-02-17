using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Nebula.EFModels.Entities;

public partial class NebulaDbContext : DbContext
{
    public NebulaDbContext(DbContextOptions<NebulaDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<BackboneSegment> BackboneSegments { get; set; }

    public virtual DbSet<BackboneSegmentType> BackboneSegmentTypes { get; set; }

    public virtual DbSet<CustomPage> CustomPages { get; set; }

    public virtual DbSet<CustomPageRole> CustomPageRoles { get; set; }

    public virtual DbSet<CustomRichText> CustomRichTexts { get; set; }

    public virtual DbSet<FieldDefinition> FieldDefinitions { get; set; }

    public virtual DbSet<RegionalSubbasin> RegionalSubbasins { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Watershed> Watersheds { get; set; }

    public virtual DbSet<vGeoServerBackbone> vGeoServerBackbones { get; set; }

    public virtual DbSet<vGeoServerRegionalSubbasin> vGeoServerRegionalSubbasins { get; set; }

    public virtual DbSet<vGeoServerWatershed> vGeoServerWatersheds { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BackboneSegment>(entity =>
        {
            entity.HasKey(e => e.BackboneSegmentID).HasName("PK_BackboneSegment_BackboneSegmentID");

            entity.HasOne(d => d.BackboneSegmentType).WithMany(p => p.BackboneSegments).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.DownstreamBackboneSegment).WithMany(p => p.InverseDownstreamBackboneSegment).HasConstraintName("FK_BackboneSegment_BackboneSegment_DownstreamBackboneSegmentID_BackboneSegmentID");
        });

        modelBuilder.Entity<BackboneSegmentType>(entity =>
        {
            entity.HasKey(e => e.BackboneSegmentTypeID).HasName("PK_BackboneSegmentType_BackboneSegmentTypeID");

            entity.Property(e => e.BackboneSegmentTypeID).ValueGeneratedNever();
        });

        modelBuilder.Entity<CustomPage>(entity =>
        {
            entity.HasKey(e => e.CustomPageID).HasName("PK_CustomPage_CustomPageID");
        });

        modelBuilder.Entity<CustomPageRole>(entity =>
        {
            entity.HasKey(e => e.CustomPageRoleID).HasName("PK_CustomPageRole_CustomPageRoleID");

            entity.HasOne(d => d.CustomPage).WithMany(p => p.CustomPageRoles).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<CustomRichText>(entity =>
        {
            entity.HasKey(e => e.CustomRichTextID).HasName("PK_CustomRichText_CustomRichTextID");
        });

        modelBuilder.Entity<FieldDefinition>(entity =>
        {
            entity.HasKey(e => e.FieldDefinitionID).HasName("PK_FieldDefinition_FieldDefinitionID");
        });

        modelBuilder.Entity<RegionalSubbasin>(entity =>
        {
            entity.HasKey(e => e.RegionalSubbasinID).HasName("PK_RegionalSubbasin_RegionalSubbasinID");

            entity.HasOne(d => d.OCSurveyDownstreamCatchment).WithMany(p => p.InverseOCSurveyDownstreamCatchment)
                .HasPrincipalKey(p => p.OCSurveyCatchmentID)
                .HasForeignKey(d => d.OCSurveyDownstreamCatchmentID)
                .HasConstraintName("FK_RegionalSubbasin_RegionalSubbasin_OCSurveyDownstreamCatchmentID_OCSurveyCatchmentID");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserID).HasName("PK_User_UserID");
        });

        modelBuilder.Entity<Watershed>(entity =>
        {
            entity.HasKey(e => e.WatershedID).HasName("PK_Watershed_WatershedID");
        });

        modelBuilder.Entity<vGeoServerBackbone>(entity =>
        {
            entity.ToView("vGeoServerBackbones");
        });

        modelBuilder.Entity<vGeoServerRegionalSubbasin>(entity =>
        {
            entity.ToView("vGeoServerRegionalSubbasins");

            entity.Property(e => e.RegionalSubbasinID).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<vGeoServerWatershed>(entity =>
        {
            entity.ToView("vGeoServerWatersheds");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
